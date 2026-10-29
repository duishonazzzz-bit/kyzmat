const fs = require("fs");
const net = require("net");
const path = require("path");
const process = require("process");
const { spawnSync } = require("child_process");
const { Pool } = require("pg");

const repoRoot = path.resolve(__dirname, "..");
process.chdir(repoRoot);

let apiEnv = {};
try {
  apiEnv = require(path.join(repoRoot, "apps", "api", "src", "config", "env")).env;
} catch {
  apiEnv = {};
}

const databaseUrl =
  process.env.DATABASE_URL ||
  apiEnv.databaseUrl ||
  "postgres://postgres:postgres@localhost:5432/kyzmat";
const memoryDbFile =
  process.env.MEMORY_DB_FILE ||
  apiEnv.memoryDbFile ||
  path.join("apps", "api", ".data", "dev-memory-db.json");

function resolveSnapshotPath(filePath) {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  return path.resolve(repoRoot, "apps", "api", filePath.replace(/^\.data[\\/]/, ".data/"));
}

function runCommand(command, args) {
  try {
    const result = spawnSync(command, args, {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: 10000,
      windowsHide: true,
    });

    return {
      ok: result.status === 0,
      status: result.status,
      stdout: result.stdout || "",
      stderr: result.stderr || "",
      error: "",
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      stdout: "",
      stderr: "",
      error: error.message || String(error),
    };
  }
}

function inspectDocker() {
  const service = runCommand("powershell", [
    "-NoProfile",
    "-Command",
    "Get-Service -Name com.docker.service -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Status",
  ]);
  const version = runCommand("docker", ["version", "--format", "{{.Server.Version}}"]);

  return {
    cliAvailable: !version.error || !/not recognized/i.test(version.error),
    daemonReachable: version.ok,
    serviceStatus: (service.stdout || "").trim() || "not_found",
    error: version.ok ? "" : (version.stderr || version.error || "").trim(),
  };
}

function inspectPostgresBinaries() {
  const candidates = [
    path.join("C:\\Program Files\\PostgreSQL\\18\\bin", "psql.exe"),
    path.join("C:\\Program Files\\PostgreSQL\\17\\bin", "psql.exe"),
    path.join("C:\\Program Files\\PostgreSQL\\16\\bin", "psql.exe"),
  ];

  const binaryPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!binaryPath) {
    return {
      installed: false,
      binaryPath: "",
      runnable: false,
      blockedByPolicy: false,
      message: "PostgreSQL binaries are not installed.",
    };
  }

  const version = runCommand("powershell", [
    "-NoProfile",
    "-Command",
    `& '${binaryPath.replace(/'/g, "''")}' --version`,
  ]);
  const combinedOutput = [version.stdout, version.stderr, version.error].filter(Boolean).join("\n");
  const blockedByPolicy =
    /Application Control policy has blocked this file/i.test(combinedOutput) ||
    /ApplicationFailedException/i.test(combinedOutput) ||
    /blocked this file/i.test(combinedOutput) ||
    /policy/i.test(combinedOutput);

  return {
    installed: true,
    binaryPath,
    runnable: version.ok,
    blockedByPolicy,
    message: version.ok
      ? version.stdout.trim()
      : (version.stderr || version.error || "Failed to execute PostgreSQL binary").trim(),
  };
}

function testTcpPort(host, port, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.on("connect", () => finish(true));
    socket.on("timeout", () => finish(false));
    socket.on("error", () => finish(false));
  });
}

async function testPostgresConnection(connectionString) {
  const pool = new Pool({
    connectionString,
    ssl: false,
    max: 1,
    connectionTimeoutMillis: 3000,
  });

  try {
    const result = await pool.query("SELECT NOW() AS now");
    return { ok: true, now: result.rows[0]?.now || null };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    await pool.end().catch(() => {});
  }
}

async function main() {
  const snapshotPath = resolveSnapshotPath(memoryDbFile);
  const hasSnapshot = fs.existsSync(snapshotPath);
  const tcp5432 = await testTcpPort("127.0.0.1", 5432);
  const postgres = await testPostgresConnection(databaseUrl);
  const docker = inspectDocker();
  const postgresBinaries = inspectPostgresBinaries();

  let recommendation = "";
  if (postgres.ok) {
    recommendation = "PostgreSQL is available. You can run npm run db:restore-memory to migrate local snapshot data.";
  } else if (tcp5432) {
    recommendation = "Port 5432 is open, but the app cannot connect to PostgreSQL. Check credentials in apps/api/.env.";
  } else if (postgresBinaries.blockedByPolicy) {
    recommendation =
      "PostgreSQL binaries are installed but blocked by Windows Application Control. Start Docker Desktop or ask for a local allow rule for PostgreSQL executables.";
  } else if (docker.cliAvailable && !docker.daemonReachable) {
    recommendation =
      "Docker Desktop is installed, but the Docker daemon is not running. Start Docker Desktop and then run docker compose up -d.";
  } else if (postgresBinaries.installed && !postgresBinaries.runnable) {
    recommendation =
      "PostgreSQL binaries exist, but they do not start correctly on this machine. Review local security policy or reinstall PostgreSQL with administrator support.";
  } else {
    recommendation = "PostgreSQL is not reachable on localhost:5432. Start PostgreSQL or Docker first.";
  }

  const payload = {
    databaseUrl,
    tcp5432,
    postgres,
    docker,
    postgresBinaries,
    snapshot: {
      exists: hasSnapshot,
      filePath: snapshotPath,
      sizeBytes: hasSnapshot ? fs.statSync(snapshotPath).size : 0,
    },
    recommendation,
  };

  console.log(JSON.stringify(payload, null, 2));
}

main().catch((error) => {
  console.error("[db-doctor] Failed:", error.message);
  process.exit(1);
});
