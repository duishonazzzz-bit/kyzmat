const bcrypt = require("bcryptjs");
const { pool } = require("./pool");
const { env } = require("../config/env");

const unsafeProductionPasswords = new Set(["admin123", "change-this-admin-password"]);

function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeUsername(value) {
  return normalizeOptionalString(value)?.toLowerCase() || null;
}

function normalizeEmail(value) {
  return normalizeOptionalString(value)?.toLowerCase() || null;
}

async function ensureDefaultAdmin() {
  const username = normalizeUsername(env.adminUsername) || "admin";
  const email = normalizeEmail(env.adminEmail) || "admin@kyzmat.local";
  const phone = normalizeOptionalString(env.adminPhone);
  const fullName = normalizeOptionalString(env.adminFullName) || "Kyzmat Admin";

  if (!env.adminPassword) {
    throw new Error("ADMIN_PASSWORD is required to create the default admin account");
  }

  if (env.nodeEnv === "production" && unsafeProductionPasswords.has(env.adminPassword)) {
    throw new Error("ADMIN_PASSWORD must be changed before running in production");
  }

  const roleResult = await pool.query("SELECT id FROM roles WHERE name = 'admin' LIMIT 1");
  if (!roleResult.rowCount) {
    throw new Error("Admin role is missing from the database");
  }

  const passwordHash = await bcrypt.hash(env.adminPassword, 10);
  const existingResult = await pool.query(
    `SELECT id
     FROM users
     WHERE LOWER(COALESCE(username, '')) = $1
        OR LOWER(COALESCE(email, '')) = $2
        OR ($3::text IS NOT NULL AND phone = $3::text)
     LIMIT 1`,
    [username, email, phone],
  );

  if (existingResult.rowCount) {
    const updatedResult = await pool.query(
      `UPDATE users
       SET role_id = $1,
           full_name = $2,
           username = $3,
           email = $4,
           phone = $5,
           password_hash = $6,
           updated_at = NOW()
       WHERE id = $7
       RETURNING id, username, email`,
      [roleResult.rows[0].id, fullName, username, email, phone, passwordHash, existingResult.rows[0].id],
    );

    return { action: "updated", user: updatedResult.rows[0] };
  }

  const insertedResult = await pool.query(
    `INSERT INTO users (role_id, full_name, username, email, phone, password_hash)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, username, email`,
    [roleResult.rows[0].id, fullName, username, email, phone, passwordHash],
  );

  return { action: "created", user: insertedResult.rows[0] };
}

module.exports = { ensureDefaultAdmin };
