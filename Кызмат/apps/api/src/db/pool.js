const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const { Pool } = require("pg");
const { newDb } = require("pg-mem");
const { env } = require("../config/env");

const MEMORY_SNAPSHOT_VERSION = 1;
const MEMORY_BACKUP_LIMIT = 10;
const MEMORY_TABLES = [
  "roles",
  "users",
  "categories",
  "jobs",
  "responses",
  "reviews",
  "messages",
  "disputes",
  "subscription_plans",
  "user_subscriptions",
  "platform_services",
  "service_orders",
];
const MEMORY_TABLES_REVERSED = [...MEMORY_TABLES].reverse();
const MEMORY_SERIAL_COLUMNS = [
  { table: "roles", column: "id" },
  { table: "categories", column: "id" },
  { table: "subscription_plans", column: "id" },
  { table: "platform_services", column: "id" },
];
const schemaSqlPath = path.resolve(__dirname, "../../sql/001_init.sql");

let mode = "postgres";
let activePool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.nodeEnv === "production" ? { rejectUnauthorized: false } : false,
});
let memoryDbContext = null;
let memoryPersistencePromise = Promise.resolve();
let memoryPersistenceQueued = false;

function formatBackupStamp(date = new Date()) {
  return date.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
}

function shouldFallbackToMemory(error) {
  const code = String(error?.code || "").toUpperCase();
  const message = String(error?.message || "").toLowerCase();

  return (
    ["ECONNREFUSED", "ECONNRESET", "ENOTFOUND", "ETIMEDOUT", "57P01", "53300"].includes(code) ||
    message.includes("connection refused") ||
    (message.includes("database") && message.includes("does not exist"))
  );
}

function sanitizeSqlForMemory(rawSql) {
  return rawSql
    .replace(/CREATE EXTENSION IF NOT EXISTS pgcrypto;?/gi, "")
    .replace(/email\s+VARCHAR\(160\)\s+UNIQUE,/i, "email VARCHAR(160),")
    .replace(/phone\s+VARCHAR\(32\)\s+UNIQUE,/i, "phone VARCHAR(32),")
    .replace(/CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs\(latitude, longitude\);?/gi, "");
}

function splitSqlStatements(rawSql) {
  const statements = [];
  let current = "";
  let quote = null;
  let inLineComment = false;
  let inBlockComment = false;
  let dollarTag = null;

  for (let index = 0; index < rawSql.length; index += 1) {
    const ch = rawSql[index];
    const next = rawSql[index + 1] || "";

    if (inLineComment) {
      current += ch;
      if (ch === "\n") {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      current += ch;
      if (ch === "*" && next === "/") {
        current += next;
        index += 1;
        inBlockComment = false;
      }
      continue;
    }

    if (dollarTag) {
      const endIndex = rawSql.indexOf(dollarTag, index);
      if (endIndex === -1) {
        current += rawSql.slice(index);
        break;
      }

      current += rawSql.slice(index, endIndex + dollarTag.length);
      index = endIndex + dollarTag.length - 1;
      dollarTag = null;
      continue;
    }

    if (quote) {
      current += ch;
      if (ch === quote && rawSql[index - 1] !== "\\") {
        quote = null;
      }
      continue;
    }

    if (ch === "-" && next === "-") {
      current += ch;
      inLineComment = true;
      continue;
    }

    if (ch === "/" && next === "*") {
      current += ch;
      inBlockComment = true;
      continue;
    }

    if (ch === "'" || ch === '"') {
      quote = ch;
      current += ch;
      continue;
    }

    if (ch === "$") {
      const match = rawSql.slice(index).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$/);
      if (match) {
        dollarTag = match[0];
        current += match[0];
        index += match[0].length - 1;
        continue;
      }
    }

    if (ch === ";") {
      const trimmed = current.trim();
      if (trimmed) {
        statements.push(trimmed);
      }
      current = "";
      continue;
    }

    current += ch;
  }

  const finalStatement = current.trim();
  if (finalStatement) {
    statements.push(finalStatement);
  }

  return statements;
}

function loadSchemaSql() {
  return fs.readFileSync(schemaSqlPath, "utf8");
}

function resolveMemorySnapshotPath() {
  if (path.isAbsolute(env.memoryDbFile)) {
    return env.memoryDbFile;
  }

  return path.resolve(__dirname, "../../", env.memoryDbFile);
}

function resolveMemoryBackupDir() {
  const snapshotPath = resolveMemorySnapshotPath();
  return path.join(path.dirname(snapshotPath), "backups");
}

function listMemoryBackupFiles() {
  const backupDir = resolveMemoryBackupDir();
  if (!fs.existsSync(backupDir)) {
    return [];
  }

  return fs
    .readdirSync(backupDir)
    .filter((entry) => entry.endsWith(".json"))
    .map((entry) => path.join(backupDir, entry))
    .sort((left, right) => fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs);
}

function pruneMemoryBackups() {
  const backupFiles = listMemoryBackupFiles();
  for (const staleFile of backupFiles.slice(MEMORY_BACKUP_LIMIT)) {
    try {
      fs.unlinkSync(staleFile);
    } catch {
      // ignore stale backup cleanup errors
    }
  }
}

function readSnapshotPayload(filePath) {
  const rawPayload = fs.readFileSync(filePath, "utf8");
  const payload = JSON.parse(rawPayload);

  if (
    payload?.version !== MEMORY_SNAPSHOT_VERSION ||
    !payload.tables ||
    typeof payload.tables !== "object"
  ) {
    throw new Error("Snapshot format is invalid");
  }

  return payload;
}

async function restoreSnapshotPayload(memoryPool, db, payload) {
  await clearMemoryTables(memoryPool);

  for (const tableName of MEMORY_TABLES) {
    await restoreTableRows(memoryPool, tableName, payload.tables[tableName]);
  }

  syncMemorySerials(db, payload.tables);
}

function escapeIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function getQueryText(query) {
  if (typeof query === "string") {
    return query;
  }

  return query?.text || "";
}

function isMutatingQuery(query) {
  const normalized = getQueryText(query).trimStart().toLowerCase();

  return (
    normalized.startsWith("insert ") ||
    normalized.startsWith("update ") ||
    normalized.startsWith("delete ") ||
    normalized.startsWith("truncate ") ||
    normalized.startsWith("alter ") ||
    normalized.startsWith("create ") ||
    normalized.startsWith("drop ")
  );
}

async function buildMemorySnapshot(memoryPool) {
  const tables = {};

  for (const tableName of MEMORY_TABLES) {
    const result = await memoryPool.query(`SELECT * FROM ${escapeIdentifier(tableName)}`);
    tables[tableName] = result.rows;
  }

  return {
    version: MEMORY_SNAPSHOT_VERSION,
    savedAt: new Date().toISOString(),
    tables,
  };
}

async function persistMemorySnapshot() {
  if (!memoryDbContext?.pool) {
    return;
  }

  const payload = await buildMemorySnapshot(memoryDbContext.pool);
  const snapshotJson = `${JSON.stringify(payload, null, 2)}\n`;
  const snapshotDir = path.dirname(memoryDbContext.filePath);
  const tempFilePath = `${memoryDbContext.filePath}.tmp`;
  const backupDir = resolveMemoryBackupDir();
  const backupFilePath = path.join(backupDir, `dev-memory-db-${formatBackupStamp(new Date(payload.savedAt))}.json`);

  fs.mkdirSync(snapshotDir, { recursive: true });
  fs.mkdirSync(backupDir, { recursive: true });
  fs.writeFileSync(tempFilePath, snapshotJson, "utf8");
  fs.renameSync(tempFilePath, memoryDbContext.filePath);
  fs.writeFileSync(backupFilePath, snapshotJson, "utf8");
  pruneMemoryBackups();

  memoryDbContext.lastSavedAt = payload.savedAt;
  memoryDbContext.lastSavedSizeBytes = Buffer.byteLength(snapshotJson, "utf8");
  memoryDbContext.backupDir = backupDir;
  memoryDbContext.lastBackupFile = backupFilePath;
}

function queueMemorySnapshotPersistence() {
  if (mode !== "memory" || !memoryDbContext?.pool) {
    return Promise.resolve();
  }

  memoryPersistenceQueued = true;
  memoryPersistencePromise = memoryPersistencePromise
    .catch((error) => {
      console.error("[db] Failed to persist local memory snapshot", error.message);
    })
    .then(async () => {
      if (!memoryPersistenceQueued || !memoryDbContext?.pool) {
        return;
      }

      memoryPersistenceQueued = false;
      await persistMemorySnapshot();
    });

  return memoryPersistencePromise;
}

async function flushMemoryPersistence() {
  if (mode !== "memory") {
    return;
  }

  if (memoryPersistenceQueued) {
    await queueMemorySnapshotPersistence();
  }

  await memoryPersistencePromise.catch((error) => {
    console.error("[db] Failed to persist local memory snapshot", error.message);
  });
}

async function clearMemoryTables(memoryPool) {
  for (const tableName of MEMORY_TABLES_REVERSED) {
    await memoryPool.query(`DELETE FROM ${escapeIdentifier(tableName)}`);
  }
}

async function restoreTableRows(memoryPool, tableName, rows) {
  if (!Array.isArray(rows) || !rows.length) {
    return;
  }

  const columns = Object.keys(rows[0]);
  const chunkSize = 100;

  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize);
    const params = [];
    const values = chunk
      .map((row) => {
        const placeholders = columns.map((columnName) => {
          params.push(row[columnName] ?? null);
          return `$${params.length}`;
        });

        return `(${placeholders.join(", ")})`;
      })
      .join(", ");

    await memoryPool.query(
      `INSERT INTO ${escapeIdentifier(tableName)} (${columns
        .map((columnName) => escapeIdentifier(columnName))
        .join(", ")}) VALUES ${values}`,
      params,
    );
  }
}

function syncMemorySerials(db, tables) {
  for (const { table: tableName, column: columnName } of MEMORY_SERIAL_COLUMNS) {
    const rows = Array.isArray(tables?.[tableName]) ? tables[tableName] : [];
    const maxValue = rows.reduce((max, row) => {
      const numericValue = Number(row?.[columnName]);
      return Number.isFinite(numericValue) && numericValue > max ? numericValue : max;
    }, 0);
    const table = db.public.getTable(tableName);
    const serials = db.data.getMap(table.serialsId);
    db.data.set(table.serialsId, serials.set(columnName, maxValue));
  }
}

async function restoreMemorySnapshot(memoryPool, db) {
  const filePath = resolveMemorySnapshotPath();
  const backupFiles = listMemoryBackupFiles();

  if (!fs.existsSync(filePath)) {
    if (!backupFiles.length) {
      return {
        filePath,
        backupDir: resolveMemoryBackupDir(),
        restoredFromDisk: false,
      };
    }

    for (const backupFile of backupFiles) {
      try {
        const payload = readSnapshotPayload(backupFile);
        await restoreSnapshotPayload(memoryPool, db, payload);

        return {
          filePath,
          backupDir: resolveMemoryBackupDir(),
          restoredFromDisk: true,
          restoredAt: payload.savedAt || null,
          restoredFromBackup: true,
          restoredSourceFile: backupFile,
        };
      } catch {
        // try next backup
      }
    }

    return {
      filePath,
      backupDir: resolveMemoryBackupDir(),
      restoredFromDisk: false,
      restoreWarning: "Primary snapshot is missing and backup restore failed, starting with a fresh local database.",
    };
  }

  try {
    const payload = readSnapshotPayload(filePath);
    await restoreSnapshotPayload(memoryPool, db, payload);

    return {
      filePath,
      backupDir: resolveMemoryBackupDir(),
      restoredFromDisk: true,
      restoredAt: payload.savedAt || null,
      restoredFromBackup: false,
      restoredSourceFile: filePath,
    };
  } catch (error) {
    for (const backupFile of backupFiles) {
      try {
        const payload = readSnapshotPayload(backupFile);
        await restoreSnapshotPayload(memoryPool, db, payload);

        return {
          filePath,
          backupDir: resolveMemoryBackupDir(),
          restoredFromDisk: true,
          restoredAt: payload.savedAt || null,
          restoredFromBackup: true,
          restoredSourceFile: backupFile,
          restoreWarning: `Primary snapshot restore failed: ${error.message}. Restored from backup instead.`,
        };
      } catch {
        // try next backup
      }
    }

    return {
      filePath,
      backupDir: resolveMemoryBackupDir(),
      restoredFromDisk: false,
      restoreWarning: `Snapshot restore failed: ${error.message}`,
    };
  }
}

async function createMemoryPool() {
  const db = newDb({ autoCreateForeignKeyIndices: true });

  db.public.registerFunction({
    name: "gen_random_uuid",
    returns: "uuid",
    impure: true,
    implementation: () => randomUUID(),
  });

  db.public.registerFunction({
    name: "radians",
    args: ["float"],
    returns: "float",
    implementation: (value) => (value * Math.PI) / 180,
  });

  db.public.registerFunction({
    name: "sin",
    args: ["float"],
    returns: "float",
    implementation: (value) => Math.sin(value),
  });

  db.public.registerFunction({
    name: "cos",
    args: ["float"],
    returns: "float",
    implementation: (value) => Math.cos(value),
  });

  db.public.registerFunction({
    name: "acos",
    args: ["float"],
    returns: "float",
    implementation: (value) => Math.acos(Math.min(1, Math.max(-1, value))),
  });

  const rawSql = loadSchemaSql();
  const normalizedSql = sanitizeSqlForMemory(rawSql);
  const statements = splitSqlStatements(normalizedSql);

  for (const statement of statements) {
    db.public.none(statement);
  }

  const adapter = db.adapters.createPg();
  const memoryPool = new adapter.Pool();
  const restoreState = await restoreMemorySnapshot(memoryPool, db);

  return {
    db,
    pool: memoryPool,
    ...restoreState,
  };
}

async function initializeDatabase() {
  try {
    await activePool.query("SELECT 1");

    for (const statement of splitSqlStatements(loadSchemaSql())) {
      await activePool.query(statement);
    }

    mode = "postgres";
    memoryDbContext = null;
    return { mode };
  } catch (error) {
    if (!shouldFallbackToMemory(error)) {
      throw error;
    }

    if (!env.allowMemoryFallback) {
      error.message = `PostgreSQL is unavailable and memory fallback is disabled: ${error.message}`;
      throw error;
    }

    const fallbackReason = error?.message || error?.code || "Unknown database connection error";
    const memoryState = await createMemoryPool();
    activePool = memoryState.pool;
    mode = "memory";
    memoryDbContext = {
      db: memoryState.db,
      pool: memoryState.pool,
      filePath: memoryState.filePath,
      backupDir: memoryState.backupDir || resolveMemoryBackupDir(),
      restoredFromDisk: memoryState.restoredFromDisk,
      restoredAt: memoryState.restoredAt || null,
      restoredFromBackup: Boolean(memoryState.restoredFromBackup),
      restoredSourceFile: memoryState.restoredSourceFile || null,
      lastSavedAt: null,
      lastSavedSizeBytes: 0,
      lastBackupFile: null,
    };
    return {
      mode,
      fallbackReason,
      filePath: memoryState.filePath,
      backupDir: memoryState.backupDir || resolveMemoryBackupDir(),
      restoredFromDisk: memoryState.restoredFromDisk,
      restoredAt: memoryState.restoredAt || null,
      restoredFromBackup: Boolean(memoryState.restoredFromBackup),
      restoredSourceFile: memoryState.restoredSourceFile || null,
      restoreWarning: memoryState.restoreWarning || null,
    };
  }
}

const pool = {
  async query(text, params) {
    const result = await activePool.query(text, params);

    if (mode === "memory" && isMutatingQuery(text)) {
      await queueMemorySnapshotPersistence();
    }

    return result;
  },
  async end() {
    await flushMemoryPersistence();

    if (activePool?.end) {
      return activePool.end();
    }
  },
};

function getDatabaseMode() {
  return mode;
}

function getMemoryPersistenceInfo() {
  return {
    enabled: mode === "memory",
    filePath: memoryDbContext?.filePath || resolveMemorySnapshotPath(),
    backupDir: memoryDbContext?.backupDir || resolveMemoryBackupDir(),
    restoredFromDisk: Boolean(memoryDbContext?.restoredFromDisk),
    restoredAt: memoryDbContext?.restoredAt || null,
    restoredFromBackup: Boolean(memoryDbContext?.restoredFromBackup),
    restoredSourceFile: memoryDbContext?.restoredSourceFile || null,
    lastSavedAt: memoryDbContext?.lastSavedAt || null,
    lastSavedSizeBytes: memoryDbContext?.lastSavedSizeBytes || 0,
    lastBackupFile: memoryDbContext?.lastBackupFile || null,
    backupCount: listMemoryBackupFiles().length,
  };
}

module.exports = {
  pool,
  initializeDatabase,
  getDatabaseMode,
  getMemoryPersistenceInfo,
  flushMemoryPersistence,
};
