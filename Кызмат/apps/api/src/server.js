const { app } = require("./app");
const { env } = require("./config/env");
const { initializeDatabase, flushMemoryPersistence } = require("./db/pool");

async function bootstrap() {
  try {
    if (env.nodeEnv === "production" && env.isDefaultJwtSecret) {
      throw new Error("JWT_SECRET is not configured for production");
    }

    const dbState = await initializeDatabase();
    const { ensureDefaultAdmin } = require("./db/default-admin");
    const adminState = await ensureDefaultAdmin();

    if (dbState.mode === "postgres") {
      console.log("[db] PostgreSQL connection established");
    } else {
      console.warn("[db] PostgreSQL unavailable, using persistent local memory database");
      console.warn(`[db] Fallback reason: ${dbState.fallbackReason}`);
      console.warn(`[db] Local snapshot file: ${dbState.filePath}`);

      if (dbState.restoredFromDisk) {
        console.warn(
          `[db] Restored local data from snapshot${dbState.restoredAt ? ` saved at ${dbState.restoredAt}` : ""}`,
        );
      } else {
        console.warn("[db] No local snapshot found yet, starting from schema defaults");
      }

      if (dbState.restoreWarning) {
        console.warn(`[db] Snapshot warning: ${dbState.restoreWarning}`);
      }
    }

    console.log(`[db] Default admin account ${adminState.action}: ${adminState.user.username}`);

    if (env.seedDemoData) {
      const { ensureDevDemoData } = require("./db/dev-demo-seed");
      await ensureDevDemoData();
      console.log("[db] Demo profiles are ready");
    }

    await flushMemoryPersistence();
  } catch (error) {
    console.error("[db] Failed to initialize database", error.message);
    process.exit(1);
  }

  app.listen(env.port, env.host, () => {
    console.log(`[api] Server started on ${env.host}:${env.port}`);
    if (env.serveWeb) {
      console.log(`[web] Static frontend is served from ${env.webDistDir || "apps/web/dist"}`);
    }
  });
}

bootstrap();
