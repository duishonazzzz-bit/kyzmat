const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true });

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";
const isRender = String(process.env.RENDER || "").toLowerCase() === "true";
const jwtSecret = process.env.JWT_SECRET || "change-me-in-production";
const configuredTrustProxyHops = process.env.TRUST_PROXY_HOPS;
const trustProxyHops = configuredTrustProxyHops === undefined
  ? (isRender ? 1 : 0)
  : Math.max(0, Number.parseInt(configuredTrustProxyHops, 10) || 0);
const configuredClientUrls = process.env.CLIENT_URLS || process.env.CLIENT_URL || "http://localhost:5173";
const clientUrls = new Set(
  configuredClientUrls.split(",").map((origin) => origin.trim()).filter(Boolean),
);

if (process.env.RENDER_EXTERNAL_URL) {
  clientUrls.add(process.env.RENDER_EXTERNAL_URL.trim());
}

const env = {
  nodeEnv,
  isRender,
  port: Number(process.env.PORT || 4000),
  host: process.env.HOST || "0.0.0.0",
  databaseUrl:
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/kyzmat",
  jwtSecret,
  isDefaultJwtSecret: jwtSecret === "change-me-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  clientUrls: [...clientUrls],
  trustProxyHops,
  vpnOnly: String(process.env.VPN_ONLY ?? (isRender ? "true" : "false")).toLowerCase() === "true",
  vpnAllowedCidrs: process.env.VPN_ALLOWED_CIDRS || "",
  memoryDbFile: process.env.MEMORY_DB_FILE || ".data/dev-memory-db.json",
  seedDemoData: String(process.env.SEED_DEMO_DATA || "").toLowerCase() === "true",
  demoSeedPassword: process.env.DEMO_SEED_PASSWORD || "",
  logDemoCredentials: String(process.env.LOG_DEMO_CREDENTIALS || "").toLowerCase() === "true",
  allowMemoryFallback:
    String(process.env.ALLOW_MEMORY_FALLBACK || (isProduction ? "false" : "true")).toLowerCase() === "true",
  serveWeb: String(process.env.SERVE_WEB || "").toLowerCase() === "true",
  webDistDir: process.env.WEB_DIST_DIR || "",
  googleMapsServerApiKey: process.env.GOOGLE_MAPS_SERVER_API_KEY || "",
  googleMapsLanguage: process.env.GOOGLE_MAPS_LANGUAGE || "ru",
  googleMapsRegion: process.env.GOOGLE_MAPS_REGION || "KG",
  googleMapsCountryCode: process.env.GOOGLE_MAPS_COUNTRY_CODE || "kg",
  adminUsername: process.env.ADMIN_USERNAME || "admin",
  adminPassword: process.env.ADMIN_PASSWORD || (isProduction ? "" : "admin123"),
  adminEmail: process.env.ADMIN_EMAIL || "admin@kyzmat.local",
  adminPhone: process.env.ADMIN_PHONE || "",
  adminFullName: process.env.ADMIN_FULL_NAME || "Kyzmat Admin",
};

module.exports = { env };
