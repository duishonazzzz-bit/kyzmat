const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const { env } = require("./config/env");
const { authRoutes } = require("./routes/auth.routes");
const { categoriesRoutes } = require("./routes/categories.routes");
const { jobsRoutes } = require("./routes/jobs.routes");
const { mapsRoutes } = require("./routes/maps.routes");
const { reviewsRoutes } = require("./routes/reviews.routes");
const { messagesRoutes } = require("./routes/messages.routes");
const { workersRoutes } = require("./routes/workers.routes");
const { usersRoutes } = require("./routes/users.routes");
const { adminRoutes } = require("./routes/admin.routes");
const { subscriptionsRoutes } = require("./routes/subscriptions.routes");
const { getDatabaseMode, getMemoryPersistenceInfo } = require("./db/pool");
const { createVpnAccessMiddleware } = require("./middleware/vpn-access");
const { errorHandler, notFound } = require("./middleware/error-handler");

const app = express();
if (env.trustProxyHops > 0) {
  app.set("trust proxy", env.trustProxyHops);
}
const allowedOrigins = env.clientUrls;
const apiBasePath = env.serveWeb ? "/api" : "";
const resolvedWebDistDir = env.webDistDir
  ? path.resolve(env.webDistDir)
  : path.resolve(__dirname, "../../web/dist");
const webIndexPath = path.join(resolvedWebDistDir, "index.html");
const hasStaticWeb = env.serveWeb && fs.existsSync(webIndexPath);

function buildApiPath(route = "") {
  return `${apiBasePath}${route}` || "/";
}

function buildDocs() {
  return [
    `POST ${buildApiPath("/auth/register")}`,
    `POST ${buildApiPath("/auth/login")}`,
    `GET ${buildApiPath("/users/me")}`,
    `GET ${buildApiPath("/users")} (admin)`,
    `GET ${buildApiPath("/admin/overview")}`,
    `GET ${buildApiPath("/admin/users")}`,
    `PATCH ${buildApiPath("/admin/users/:userId")}`,
    `PATCH ${buildApiPath("/admin/users/:userId/block")}`,
    `GET ${buildApiPath("/admin/jobs")}`,
    `PATCH ${buildApiPath("/admin/jobs/:jobId")}`,
    `DELETE ${buildApiPath("/admin/jobs/:jobId")}`,
    `GET ${buildApiPath("/admin/plans")}`,
    `POST ${buildApiPath("/admin/plans")}`,
    `PATCH ${buildApiPath("/admin/plans/:planId")}`,
    `GET ${buildApiPath("/admin/subscriptions")}`,
    `PATCH ${buildApiPath("/admin/subscriptions/:subscriptionId")}`,
    `GET ${buildApiPath("/admin/services")}`,
    `POST ${buildApiPath("/admin/services")}`,
    `PATCH ${buildApiPath("/admin/services/:serviceId")}`,
    `GET ${buildApiPath("/admin/service-orders")}`,
    `PATCH ${buildApiPath("/admin/service-orders/:orderId")}`,
    `GET ${buildApiPath("/workers")}`,
    `GET ${buildApiPath("/jobs")}`,
    `GET ${buildApiPath("/jobs/:jobId")}`,
    `POST ${buildApiPath("/jobs")}`,
    `GET ${buildApiPath("/maps/config")}`,
    `GET ${buildApiPath("/maps/autocomplete")}`,
    `GET ${buildApiPath("/maps/geocode")}`,
    `GET ${buildApiPath("/maps/route")}`,
    `POST ${buildApiPath("/jobs/respond")}`,
    `POST ${buildApiPath("/jobs/:jobId/select-worker")}`,
    `PATCH ${buildApiPath("/jobs/:jobId/status")}`,
    `PATCH ${buildApiPath("/jobs/:jobId/live-status")}`,
    `POST ${buildApiPath("/reviews")}`,
    `GET ${buildApiPath("/messages")}`,
    `POST ${buildApiPath("/messages")}`,
    `GET ${buildApiPath("/subscriptions/me")}`,
    `POST ${buildApiPath("/subscriptions/activate")}`,
    `POST ${buildApiPath("/subscriptions/services/order")}`,
  ];
}

function buildHealthPayload() {
  const persistence = getMemoryPersistenceInfo();

  return {
    status: "healthy",
    database: {
      mode: getDatabaseMode(),
      persistentFallback: persistence.enabled
        ? {
            filePath: persistence.filePath,
            restoredFromDisk: persistence.restoredFromDisk,
            restoredAt: persistence.restoredAt,
            lastSavedAt: persistence.lastSavedAt,
          }
        : null,
    },
  };
}

app.get("/healthz", (_req, res) => {
  res.status(200).type("text/plain").send("ok");
});

app.use(createVpnAccessMiddleware({
  enabled: env.vpnOnly,
  allowedCidrs: env.vpnAllowedCidrs,
  useCloudflareClientIp: env.isRender,
}));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const localhostRegex = /^https?:\/\/localhost:\d+$/i;
      if (env.nodeEnv !== "production" && localhostRegex.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS: Origin not allowed"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => {
  res.json(buildHealthPayload());
});

const apiRouter = express.Router();

apiRouter.get("/", (req, res) => {
  res.json({
    service: "Kyzmat API",
    status: "ok",
    docs: buildDocs(),
  });
});

if (env.serveWeb) {
  apiRouter.get("/health", (req, res) => {
    res.json(buildHealthPayload());
  });
}

apiRouter.use("/auth", authRoutes);
apiRouter.use("/users", usersRoutes);
apiRouter.use("/admin", adminRoutes);
apiRouter.use("/workers", workersRoutes);
apiRouter.use("/categories", categoriesRoutes);
apiRouter.use("/maps", mapsRoutes);
apiRouter.use("/jobs", jobsRoutes);
apiRouter.use("/reviews", reviewsRoutes);
apiRouter.use("/messages", messagesRoutes);
apiRouter.use("/subscriptions", subscriptionsRoutes);

app.use(apiBasePath || "/", apiRouter);

if (hasStaticWeb) {
  app.use(express.static(resolvedWebDistDir));
  app.get(/^(?!\/api(?:\/|$)|\/health(?:z)?$).*/, (req, res) => {
    res.sendFile(webIndexPath);
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = { app };
