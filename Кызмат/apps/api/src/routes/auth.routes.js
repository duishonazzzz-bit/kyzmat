const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Router } = require("express");
const { z } = require("zod");
const { pool } = require("../db/pool");
const { env } = require("../config/env");
const { parseWorkerResume, serializeWorkerResume, workerResumeInputSchema } = require("../utils/worker-resume");

const router = Router();

const usernameSchema = z
  .string()
  .min(3)
  .max(40)
  .regex(/^[\p{L}\p{N}._-]+$/u, "Логин может содержать только буквы, цифры, точку, дефис и нижнее подчеркивание");

function normalizeUsername(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  return trimmed || null;
}

const registerSchema = z
  .object({
    fullName: z.string().min(2),
    fullNameKy: z.string().min(2).max(160).optional(),
    fullNameEn: z.string().min(2).max(160).optional(),
    username: usernameSchema.optional(),
    email: z.string().email().optional(),
    phone: z.string().min(6).optional(),
    password: z.string().min(6),
    role: z.enum(["customer", "worker", "admin"]).default("customer"),
    city: z.string().min(2).max(120).optional(),
    bio: z.string().max(500).optional(),
    skills: z.array(z.string().min(1).max(64)).max(25).optional(),
    workerResume: workerResumeInputSchema.optional(),
  })
  .refine((value) => Boolean(value.email || value.phone || value.username), {
    message: "Укажите логин, email или phone",
    path: ["username"],
  });

const loginSchema = z.object({
  identifier: z.string().trim().min(3),
  password: z.string().min(6),
});

function toAuthPayload(user) {
  return {
    id: user.id,
    fullName: user.full_name,
    fullNameKy: user.full_name_ky || null,
    fullNameEn: user.full_name_en || null,
    username: user.username || null,
    email: user.email,
    phone: user.phone,
    city: user.city,
    bio: user.bio,
    avatarUrl: user.avatar_url || null,
    skills: user.skills || [],
    workerResume: parseWorkerResume(user.worker_resume),
    rating: Number(user.rating || 0),
    totalReviews: Number(user.total_reviews || 0),
    isPro: user.is_pro,
    role: user.role_name,
  };
}

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role_name }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

router.post("/register", async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);

    if (payload.role === "admin" && env.nodeEnv === "production") {
      return res.status(403).json({ message: "Регистрация администраторов через публичный endpoint запрещена" });
    }

    const roleResult = await pool.query("SELECT id FROM roles WHERE name = $1", [payload.role]);
    if (!roleResult.rowCount) {
      return res.status(400).json({ message: "Роль не найдена" });
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const normalizedUsername = normalizeUsername(payload.username);
    const normalizedEmail = payload.email ? payload.email.toLowerCase() : null;
    const normalizedPhone = payload.phone || null;

    if (normalizedUsername) {
      const usernameExists = await pool.query(
        "SELECT id FROM users WHERE username = $1 LIMIT 1",
        [normalizedUsername],
      );
      if (usernameExists.rowCount) {
        return res.status(409).json({ message: "Пользователь с таким логином уже существует" });
      }
    }

    if (normalizedEmail) {
      const emailExists = await pool.query(
        "SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
        [normalizedEmail],
      );
      if (emailExists.rowCount) {
        return res.status(409).json({ message: "Пользователь с таким email уже существует" });
      }
    }

    if (normalizedPhone) {
      const phoneExists = await pool.query(
        "SELECT id FROM users WHERE phone = $1 LIMIT 1",
        [normalizedPhone],
      );
      if (phoneExists.rowCount) {
        return res.status(409).json({ message: "Пользователь с таким phone уже существует" });
      }
    }

    const insertResult = await pool.query(
      `INSERT INTO users (role_id, full_name, full_name_ky, full_name_en, username, email, phone, password_hash, city, bio, skills, worker_resume)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        roleResult.rows[0].id,
        payload.fullName,
        payload.fullNameKy || null,
        payload.fullNameEn || null,
        normalizedUsername,
        normalizedEmail,
        normalizedPhone,
        passwordHash,
        payload.city || null,
        payload.bio || null,
        payload.skills || [],
        payload.role === "worker" ? serializeWorkerResume(payload.workerResume) : serializeWorkerResume(),
      ],
    );

    const userResult = await pool.query(
      `SELECT u.id, u.full_name, u.full_name_ky, u.full_name_en, u.username, u.email, u.phone, u.city, u.bio, u.avatar_url, u.skills, u.worker_resume,
              u.rating, u.total_reviews, u.is_pro, r.name AS role_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [insertResult.rows[0].id],
    );

    const user = userResult.rows[0];
    return res.status(201).json({ token: signToken(user), user: toAuthPayload(user) });
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({ message: "Пользователь с таким логином, email или phone уже существует" });
    }
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const normalizedIdentifier = payload.identifier.trim().toLowerCase();
    const rawIdentifier = payload.identifier.trim();

    const userResult = await pool.query(
      `SELECT u.id, u.full_name, u.full_name_ky, u.full_name_en, u.username, u.email, u.phone, u.city, u.bio, u.avatar_url, u.skills, u.worker_resume,
              u.rating, u.total_reviews, u.is_pro, u.is_blocked, u.password_hash, r.name AS role_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE LOWER(COALESCE(u.email, '')) = $1
          OR LOWER(COALESCE(u.username, '')) = $1
          OR u.phone = $2
       LIMIT 1`,
      [normalizedIdentifier, rawIdentifier],
    );

    if (!userResult.rowCount) {
      return res.status(401).json({ message: "Неверный логин или пароль" });
    }

    const user = userResult.rows[0];
    const isValidPassword = await bcrypt.compare(payload.password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Неверный логин или пароль" });
    }

    if (user.is_blocked) {
      return res.status(403).json({ message: "Аккаунт заблокирован. Обратитесь к администратору." });
    }

    return res.json({ token: signToken(user), user: toAuthPayload(user) });
  } catch (error) {
    return next(error);
  }
});

module.exports = { authRoutes: router };
