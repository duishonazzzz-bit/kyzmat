import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const logsDir = path.join(repoRoot, "logs");
const stateFile = path.join(logsDir, "prod-processes.json");
const accessFile = path.join(logsDir, "prod-access.json");
const isWindows = process.platform === "win32";
const prodPort = Number(process.env.PROD_PORT || 8080);
const healthUrl = `http://127.0.0.1:${prodPort}/health`;
function ensureLogsDir() {
  fs.mkdirSync(logsDir, { recursive: true });
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile, "utf8"));
  } catch {
    return {};
  }
}

function writeState(state) {
  ensureLogsDir();
  fs.writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function isProcessAlive(pid) {
  if (!pid || Number.isNaN(Number(pid))) {
    return false;
  }

  try {
    process.kill(Number(pid), 0);
    return true;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestUrl(url, timeoutMs = 2500) {
  const client = url.startsWith("https:") ? https : http;

  return new Promise((resolve) => {
    const request = client.get(url, { timeout: timeoutMs }, (response) => {
      response.resume();
      resolve({ ok: true, statusCode: response.statusCode || 0 });
    });

    request.on("timeout", () => {
      request.destroy();
      resolve({ ok: false, statusCode: 0 });
    });

    request.on("error", () => {
      resolve({ ok: false, statusCode: 0 });
    });
  });
}

async function waitForHealthyUrl(url, timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const result = await requestUrl(url);
    if (result.ok && result.statusCode >= 200 && result.statusCode < 500) {
      return true;
    }
    await sleep(1000);
  }

  return false;
}

function stopPid(pid) {
  if (!isProcessAlive(pid)) {
    return;
  }

  if (isWindows) {
    spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }

  process.kill(-Number(pid), "SIGTERM");
}

function detectLocalIpv4() {
  const interfaces = os.networkInterfaces();

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.internal) {
        return entry.address;
      }
    }
  }

  return "127.0.0.1";
}

function fetchPublicIp() {
  return new Promise((resolve) => {
    const request = https.get("https://api.ipify.org?format=text", { timeout: 5000 }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        resolve(body.trim() || "");
      });
    });

    request.on("timeout", () => {
      request.destroy();
      resolve("");
    });

    request.on("error", () => {
      resolve("");
    });
  });
}

function writeAccessInfo(accessInfo) {
  ensureLogsDir();
  fs.writeFileSync(accessFile, `${JSON.stringify(accessInfo, null, 2)}\n`, "utf8");
}

function buildClientUrls(localIp, publicIp) {
  const urls = [
    `http://localhost:${prodPort}`,
    `http://127.0.0.1:${prodPort}`,
    `http://${localIp}:${prodPort}`,
  ];

  if (publicIp) {
    urls.push(`http://${publicIp}:${prodPort}`);
  }

  return [...new Set(urls)];
}

function buildEnvironment(localIp, publicIp) {
  const clientUrls = buildClientUrls(localIp, publicIp);
  const webDistDir = path.join(repoRoot, "apps", "web", "dist");

  return {
    ...process.env,
    NODE_ENV: "production",
    PORT: String(prodPort),
    CLIENT_URL: `http://${localIp}:${prodPort}`,
    CLIENT_URLS: clientUrls.join(","),
    SEED_DEMO_DATA: "false",
    ALLOW_MEMORY_FALLBACK: "false",
    SERVE_WEB: "true",
    WEB_DIST_DIR: webDistDir,
    MEMORY_DB_FILE: ".data/prod-standalone-db.json",
  };
}

function buildFrontend() {
  const command = isWindows ? "cmd.exe" : "npm";
  const args = isWindows
    ? ["/d", "/s", "/c", "npm --workspace apps/web run build"]
    : ["--workspace", "apps/web", "run", "build"];

  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      VITE_API_URL: "/api",
    },
  });

  if (result.status !== 0) {
    throw new Error("Frontend build failed");
  }
}

function startDetachedProcess(command, args, cwd, env, outLog, errLog) {
  ensureLogsDir();
  const outFd = fs.openSync(outLog, "a");
  const errFd = fs.openSync(errLog, "a");

  const child = spawn(command, args, {
    cwd,
    detached: true,
    stdio: ["ignore", outFd, errFd],
    windowsHide: true,
    env,
  });

  child.unref();

  fs.closeSync(outFd);
  fs.closeSync(errFd);

  return child.pid;
}

async function startProd() {
  const state = readState();
  const current = state.prod;

  if (current?.pid && isProcessAlive(current.pid)) {
    const healthy = await waitForHealthyUrl(healthUrl, 2000);
    if (healthy) {
      console.log(`Production: already running (pid ${current.pid})`);
      console.log(`URL: ${current.localUrl}`);
      return;
    }

    stopPid(current.pid);
    delete state.prod;
    writeState(state);
  }

  buildFrontend();

  const localIp = detectLocalIpv4();
  const publicIp = await fetchPublicIp();
  const env = buildEnvironment(localIp, publicIp);
  const outLog = path.join(logsDir, "prod-managed.out.log");
  const errLog = path.join(logsDir, "prod-managed.err.log");
  const pid = startDetachedProcess(
    process.execPath,
    ["src/server.js"],
    path.join(repoRoot, "apps", "api"),
    env,
    outLog,
    errLog,
  );

  state.prod = {
    pid,
    startedAt: new Date().toISOString(),
    localUrl: `http://${localIp}:${prodPort}`,
    localhostUrl: `http://localhost:${prodPort}`,
    publicUrl: publicIp ? `http://${publicIp}:${prodPort}` : "",
    healthUrl,
    outLog,
    errLog,
  };
  writeState(state);
  writeAccessInfo(state.prod);

  const healthy = await waitForHealthyUrl(healthUrl, 30000);
  if (!healthy) {
    stopPid(pid);
    delete state.prod;
    writeState(state);
    throw new Error("Production server did not become healthy in time");
  }

  console.log(`Production: started (pid ${pid})`);
  console.log(`LAN: http://${localIp}:${prodPort}`);
  console.log(`Localhost: http://localhost:${prodPort}`);
  if (publicIp) {
    console.log(`Public IP: http://${publicIp}:${prodPort}`);
  }
}

async function stopProd() {
  const state = readState();
  const current = state.prod;

  if (current?.pid) {
    stopPid(current.pid);
    await sleep(1000);
  }

  delete state.prod;
  writeState(state);
  console.log("Production: stop command sent");
}

async function printStatus() {
  const state = readState();
  const current = state.prod;
  const healthy = await waitForHealthyUrl(healthUrl, 1500);
  const alive = current?.pid ? isProcessAlive(current.pid) : false;

  if (alive) {
    console.log(`Production: running (managed, pid ${current.pid}) -> ${healthy ? "healthy" : "not healthy yet"}`);
    console.log(`LAN: ${current.localUrl}`);
    console.log(`Localhost: ${current.localhostUrl}`);
    if (current.publicUrl) {
      console.log(`Public IP: ${current.publicUrl}`);
    }
    console.log(`Logs: ${current.outLog}`);
    return;
  }

  if (healthy) {
    console.log(`Production: running (external process) -> healthy`);
    return;
  }

  console.log("Production: stopped");
}

async function restartProd() {
  await stopProd();
  await sleep(1500);
  await startProd();
}

const command = (process.argv[2] || "status").toLowerCase();

try {
  ensureLogsDir();

  if (command === "start") {
    await startProd();
  } else if (command === "stop") {
    await stopProd();
  } else if (command === "restart") {
    await restartProd();
  } else {
    await printStatus();
  }
} catch (error) {
  console.error(error.message || String(error));
  process.exit(1);
}
