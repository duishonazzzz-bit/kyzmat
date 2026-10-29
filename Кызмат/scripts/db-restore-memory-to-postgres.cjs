const fs = require("fs");
const path = require("path");
const process = require("process");
const { Pool } = require("pg");

const repoRoot = path.resolve(__dirname, "..");
process.chdir(repoRoot);

const { env } = require(path.join(repoRoot, "apps", "api", "src", "config", "env"));

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

function escapeIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function resolveSnapshotPath() {
  if (path.isAbsolute(env.memoryDbFile)) {
    return env.memoryDbFile;
  }

  return path.resolve(repoRoot, "apps", "api", env.memoryDbFile);
}

function loadSnapshot() {
  const filePath = resolveSnapshotPath();
  if (!fs.existsSync(filePath)) {
    throw new Error(`Memory snapshot not found: ${filePath}`);
  }

  return {
    filePath,
    payload: JSON.parse(fs.readFileSync(filePath, "utf8")),
  };
}

function loadSchemaSql() {
  const schemaSqlPath = path.resolve(repoRoot, "apps", "api", "sql", "001_init.sql");
  return fs.readFileSync(schemaSqlPath, "utf8");
}

function isConnectionUnavailable(error) {
  const code = String(error?.code || "").toUpperCase();
  const message = String(error?.message || "").toLowerCase();

  return (
    ["ECONNREFUSED", "ECONNRESET", "ENOTFOUND", "ETIMEDOUT", "57P01", "53300"].includes(code) ||
    message.includes("connection refused") ||
    (message.includes("database") && message.includes("does not exist"))
  );
}

function formatRestoreError(error) {
  if (isConnectionUnavailable(error)) {
    return [
      `PostgreSQL is not reachable at ${env.databaseUrl}.`,
      "Start PostgreSQL or Docker Desktop, then run `npm run db:restore-memory` again.",
      "For a local diagnosis, run `npm run db:doctor`.",
    ].join(" ");
  }

  return error.message || error.code || "Unable to restore memory snapshot to PostgreSQL";
}

async function clearTables(client) {
  for (const tableName of MEMORY_TABLES_REVERSED) {
    await client.query(`DELETE FROM ${escapeIdentifier(tableName)}`);
  }
}

async function insertRows(client, tableName, rows) {
  if (!Array.isArray(rows) || !rows.length) {
    return;
  }

  const columns = Object.keys(rows[0]);
  const chunkSize = 100;

  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize);
    const params = [];
    const valuesSql = chunk
      .map((row) => {
        const placeholders = columns.map((columnName) => {
          params.push(row[columnName] ?? null);
          return `$${params.length}`;
        });
        return `(${placeholders.join(", ")})`;
      })
      .join(", ");

    await client.query(
      `INSERT INTO ${escapeIdentifier(tableName)} (${columns.map(escapeIdentifier).join(", ")}) VALUES ${valuesSql}`,
      params,
    );
  }
}

async function syncSerials(client) {
  for (const { table, column } of MEMORY_SERIAL_COLUMNS) {
    await client.query(
      `SELECT setval(
        pg_get_serial_sequence($1, $2),
        COALESCE((SELECT MAX(${escapeIdentifier(column)}) FROM ${escapeIdentifier(table)}), 1),
        EXISTS(SELECT 1 FROM ${escapeIdentifier(table)})
      )`,
      [table, column],
    );
  }
}

async function main() {
  const { filePath, payload } = loadSnapshot();
  const pool = new Pool({
    connectionString: env.databaseUrl,
    ssl: env.nodeEnv === "production" ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000,
  });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(loadSchemaSql());
    await clearTables(client);

    for (const tableName of MEMORY_TABLES) {
      await insertRows(client, tableName, payload.tables?.[tableName] || []);
    }

    await syncSerials(client);
    await client.query("COMMIT");

    console.log(
      JSON.stringify(
        {
          restored: true,
          snapshotFile: filePath,
          databaseUrl: env.databaseUrl,
          savedAt: payload.savedAt || null,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
    await pool.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error(
    "[db-restore-memory-to-postgres] Failed:",
    formatRestoreError(error),
  );
  process.exit(1);
});
