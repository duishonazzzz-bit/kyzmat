const fs = require("fs");
const path = require("path");
const process = require("process");

const repoRoot = path.resolve(__dirname, "..");
process.chdir(repoRoot);
const credentialLogFiles = [
  path.join(repoRoot, "logs", "dev-demo-accounts.json"),
  path.join(repoRoot, "logs", "demo-seed.json"),
];

const {
  initializeDatabase,
  pool,
  flushMemoryPersistence,
  getDatabaseMode,
  getMemoryPersistenceInfo,
} = require(path.join(repoRoot, "apps", "api", "src", "db", "pool"));

function buildInClause(values, startIndex = 1) {
  return values.map((_, index) => `$${startIndex + index}`).join(", ");
}

async function cleanupDemoData() {
  await initializeDatabase();

  const demoUsersResult = await pool.query(
    `SELECT u.id
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE r.name IN ('customer', 'worker')
       AND (
         LOWER(COALESCE(u.email, '')) LIKE '%@kyzmat.local'
         OR LOWER(COALESCE(u.username, '')) IN ('testworker_ext', 'testcustomer_ext')
       )`,
  );

  const demoUserIds = demoUsersResult.rows.map((row) => row.id);
  const demoJobConditions = [
    "LOWER(COALESCE(title, '')) LIKE '[demo]%'",
    "LOWER(COALESCE(title, '')) LIKE '[audit]%'",
    "LOWER(COALESCE(title, '')) LIKE 'demo %'",
  ];
  const demoJobParams = [];

  if (demoUserIds.length) {
    const customerPlaceholders = buildInClause(demoUserIds, 1);
    const workerPlaceholders = buildInClause(demoUserIds, demoUserIds.length + 1);
    demoJobConditions.push(`customer_id IN (${customerPlaceholders})`);
    demoJobConditions.push(`worker_id IN (${workerPlaceholders})`);
    demoJobParams.push(...demoUserIds, ...demoUserIds);
  }

  const demoJobsResult = await pool.query(
    `SELECT id
     FROM jobs
     WHERE ${demoJobConditions.join(" OR ")}`,
    demoJobParams,
  );

  const demoJobIds = demoJobsResult.rows.map((row) => row.id);

  if (demoJobIds.length) {
    const jobPlaceholders = buildInClause(demoJobIds);
    await pool.query(`DELETE FROM messages WHERE job_id IN (${jobPlaceholders})`, demoJobIds);
    await pool.query(`DELETE FROM reviews WHERE job_id IN (${jobPlaceholders})`, demoJobIds);
    await pool.query(`DELETE FROM disputes WHERE job_id IN (${jobPlaceholders})`, demoJobIds);
    await pool.query(`DELETE FROM responses WHERE job_id IN (${jobPlaceholders})`, demoJobIds);
    await pool.query(`DELETE FROM jobs WHERE id IN (${jobPlaceholders})`, demoJobIds);
  }

  if (demoUserIds.length) {
    const userPlaceholders = buildInClause(demoUserIds);
    const doubledUserPlaceholders = buildInClause(demoUserIds, demoUserIds.length + 1);
    await pool.query(
      `DELETE FROM messages
       WHERE sender_id IN (${userPlaceholders})
          OR receiver_id IN (${doubledUserPlaceholders})`,
      [...demoUserIds, ...demoUserIds],
    );
    await pool.query(
      `DELETE FROM reviews
       WHERE reviewer_id IN (${userPlaceholders})
          OR reviewee_id IN (${doubledUserPlaceholders})`,
      [...demoUserIds, ...demoUserIds],
    );
    await pool.query(`DELETE FROM responses WHERE worker_id IN (${userPlaceholders})`, demoUserIds);
    await pool.query(`DELETE FROM disputes WHERE opened_by IN (${userPlaceholders})`, demoUserIds);
    await pool.query(`DELETE FROM user_subscriptions WHERE user_id IN (${userPlaceholders})`, demoUserIds);
    await pool.query(`DELETE FROM service_orders WHERE user_id IN (${userPlaceholders})`, demoUserIds);
    await pool.query(`DELETE FROM users WHERE id IN (${userPlaceholders})`, demoUserIds);
  }

  await flushMemoryPersistence();

  for (const logFile of credentialLogFiles) {
    try {
      if (fs.existsSync(logFile)) {
        fs.unlinkSync(logFile);
      }
    } catch {
      // ignore log cleanup errors
    }
  }

  const persistence = getMemoryPersistenceInfo();
  console.log(
    JSON.stringify(
      {
        databaseMode: getDatabaseMode(),
        deletedUsers: demoUserIds.length,
        deletedJobs: demoJobIds.length,
        snapshotFile: persistence.filePath,
      },
      null,
      2,
    ),
  );
}

cleanupDemoData()
  .catch(async (error) => {
    try {
      await flushMemoryPersistence();
    } catch {
      // ignore secondary persistence errors on cleanup failure
    }

    console.error("[cleanup-demo-data] Failed:", error.message);
    process.exit(1);
  });
