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
const stateFile = path.join(logsDir, "dev-processes.json");
const isWindows = process.platform === "win32";
const lanIp = detectLanIp();
const lanWebUrl = lanIp ? `http://${lanIp}:5174` : "";
const lanApiUrl = lanIp ? `http://${lanIp}:4001` : "";

const services = [
  {
    key: "api",
    name: "API",
    cwd: path.join(repoRoot, "apps", "api"),
    command: process.execPath,
    args: ["src/server.js"],
    url: "http://localhost:4001/health",
    outLog: path.join(logsDir, "api-managed.out.log"),
    errLog: path.join(logsDir, "api-managed.err.log"),
    startupTimeoutMs: 20000,
    env: buildApiEnv(),
  },
  {
    key: "web",
    name: "Web",
    cwd: repoRoot,
    prepare: {
      command: process.execPath,
      args: [path.join(repoRoot, "scripts", "build-web-fallback.mjs")],
      cwd: repoRoot,
      env: buildWebEnv(),
    },
    command: process.execPath,
    args: [path.join(repoRoot, "scripts", "static-web-server.cjs")],
    url: "http://localhost:5174",
    outLog: path.join(logsDir, "web-managed.out.log"),
    errLog: path.join(logsDir, "web-managed.err.log"),
    startupTimeoutMs: 25000,
    env: buildWebEnv(),
  },
];

function detectLanIp() {
  const networkInterfaces = os.networkInterfaces();

  for (const addresses of Object.values(networkInterfaces)) {
    for (const address of addresses || []) {
      if (address.family !== "IPv4" || address.internal) {
        continue;
      }

      if (address.address.startsWith("169.254.")) {
        continue;
      }

      return address.address;
    }
  }

  return "";
}

function buildApiEnv() {
  const baseEnv = {
    SEED_DEMO_DATA: "false",
  };

  if (!lanWebUrl) {
    return baseEnv;
  }

  return {
    ...baseEnv,
    CLIENT_URL: lanWebUrl,
    CLIENT_URLS: ["http://localhost:5173", "http://localhost:5174", lanWebUrl].join(","),
  };
}

function buildWebEnv() {
  return {
    STATIC_WEB_HOST: "0.0.0.0",
    ...(lanApiUrl ? { VITE_API_URL: lanApiUrl } : {}),
  };
}

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

function requestJson(url, timeoutMs = 2500) {
  const client = url.startsWith("https:") ? https : http;

  return new Promise((resolve) => {
    const request = client.get(url, { timeout: timeoutMs }, (response) => {
      let body = "";

      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });

      response.on("end", () => {
        try {
          resolve({
            ok: true,
            statusCode: response.statusCode || 0,
            data: JSON.parse(body || "{}"),
          });
        } catch {
          resolve({
            ok: false,
            statusCode: response.statusCode || 0,
            data: null,
          });
        }
      });
    });

    request.on("timeout", () => {
      request.destroy();
      resolve({ ok: false, statusCode: 0, data: null });
    });

    request.on("error", () => {
      resolve({ ok: false, statusCode: 0, data: null });
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

function startDetachedProcess(service) {
  ensureLogsDir();

  const outFd = fs.openSync(service.outLog, "a");
  const errFd = fs.openSync(service.errLog, "a");

  const child = spawn(service.command, service.args, {
    cwd: service.cwd,
    detached: true,
    stdio: ["ignore", outFd, errFd],
    windowsHide: true,
    env: { ...process.env, ...(service.env || {}) },
  });

  child.unref();

  fs.closeSync(outFd);
  fs.closeSync(errFd);

  return child.pid;
}

function runBlockingCommand(command, args, cwd, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    windowsHide: true,
    env: { ...process.env, ...extraEnv },
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

async function startService(service, state) {
  if (service.prepare) {
    runBlockingCommand(
      service.prepare.command,
      service.prepare.args,
      service.prepare.cwd,
      service.prepare.env || {},
    );
  }

  const current = state[service.key];

  if (current?.pid && isProcessAlive(current.pid)) {
    const healthy = await waitForHealthyUrl(service.url, 2000);
    if (healthy) {
      return { status: "already_managed", pid: current.pid };
    }

    stopPid(current.pid);
    delete state[service.key];
    writeState(state);
  }

  const externallyHealthy = await waitForHealthyUrl(service.url, 2000);
  if (externallyHealthy) {
    return { status: "already_external" };
  }

  const pid = startDetachedProcess(service);
  state[service.key] = {
    pid,
    startedAt: new Date().toISOString(),
    url: service.url,
    managed: true,
  };
  writeState(state);

  const healthy = await waitForHealthyUrl(service.url, service.startupTimeoutMs);
  if (!healthy) {
    stopPid(pid);
    delete state[service.key];
    writeState(state);
    throw new Error(`${service.name} did not become healthy in time`);
  }

  return { status: "started", pid };
}

async function stopService(service, state) {
  const current = state[service.key];
  if (current?.pid) {
    stopPid(current.pid);
    await sleep(1000);
  }
  delete state[service.key];
  writeState(state);
}

async function printStatus() {
  const state = readState();
  let hasManaged = false;

  for (const service of services) {
    const current = state[service.key];
    const healthy = await waitForHealthyUrl(service.url, 1500);
    const alive = current?.pid ? isProcessAlive(current.pid) : false;

    if (current?.pid) {
      hasManaged = true;
    }

    if (alive) {
      console.log(`${service.name}: running (managed, pid ${current.pid}) -> ${healthy ? "healthy" : "not healthy yet"}`);
      continue;
    }

    if (healthy) {
      console.log(`${service.name}: running (external process) -> healthy`);
      continue;
    }

    console.log(`${service.name}: stopped`);
  }

  if (!hasManaged && !fs.existsSync(stateFile)) {
    console.log(`State file: not created yet`);
    return;
  }

  console.log(`State file: ${stateFile}`);
}

async function startAll() {
  const state = readState();

  for (const service of services) {
    const result = await startService(service, state);

    if (result.status === "started") {
      console.log(`${service.name}: started (pid ${result.pid})`);
    } else if (result.status === "already_managed") {
      console.log(`${service.name}: already running (pid ${result.pid})`);
    } else {
      console.log(`${service.name}: already running outside dev manager`);
    }
  }

  console.log(`API: http://localhost:4001/health`);
  console.log(`Web: http://localhost:5174`);
  if (lanIp) {
    console.log(`API (LAN): ${lanApiUrl}/health`);
    console.log(`Web (LAN): ${lanWebUrl}`);
  }

  const apiHealth = await requestJson("http://localhost:4001/health", 3000);
  const databaseMode = apiHealth.data?.database?.mode || "";
  if (databaseMode && databaseMode !== "postgres") {
    console.log(`Warning: API is running in ${databaseMode} database mode, not PostgreSQL.`);
  }
}

async function stopAll() {
  const state = readState();

  for (const service of services) {
    await stopService(service, state);
    console.log(`${service.name}: stop command sent`);
  }
}

async function restartAll() {
  await stopAll();
  await sleep(1500);
  await startAll();
}

const command = (process.argv[2] || "status").toLowerCase();

try {
  ensureLogsDir();

  if (command === "start") {
    await startAll();
  } else if (command === "stop") {
    await stopAll();
  } else if (command === "restart") {
    await restartAll();
  } else {
    await printStatus();
  }
} catch (error) {
  console.error(error.message || String(error));
  process.exit(1);
}
