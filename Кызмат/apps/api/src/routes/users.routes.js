const { Router } = require("express");
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const { pool } = require("../db/pool");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { parseWorkerResume, serializeWorkerResume, workerResumeInputSchema } = require("../utils/worker-resume");

const router = Router();

const nullableTrimmedString = (schema) =>
  z.preprocess((value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    }
    return value;
  }, schema.nullable().optional());

const trimmedString = (schema) =>
  z.preprocess((value) => {
    if (typeof value === "string") {
      return value.trim();
    }
    return value;
  }, schema);

const avatarStringSchema = z
  .string()
  .min(1)
  .max(3000000)
  .refine(
    (value) =>
      /^data:image\/[a-z0-9.+-]+;base64,/i.test(value) ||
      /^https?:\/\//i.test(value) ||
      value.startsWith("/"),
    {
      message: "Фото профиля должно быть изображением, ссылкой или data URL",
    },
  );

const updateProfileSchema = z
  .object({
    fullName: trimmedString(z.string().min(2).max(160)).optional(),
    fullNameKy: nullableTrimmedString(z.string().min(2).max(160)),
    fullNameEn: nullableTrimmedString(z.string().min(2).max(160)),
    email: nullableTrimmedString(z.string().email()),
    phone: nullableTrimmedString(z.string().min(6).max(32)),
    city: nullableTrimmedString(z.string().min(2).max(120)),
    bio: nullableTrimmedString(z.string().max(500)),
    avatarUrl: nullableTrimmedString(avatarStringSchema),
    skills: z.array(trimmedString(z.string().min(1).max(64))).max(25).optional(),
    workerResume: workerResumeInputSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Нет данных для обновления",
  });

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Введите текущий пароль"),
    newPassword: trimmedString(z.string().min(6).max(160)),
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: "Новый пароль должен отличаться от текущего",
    path: ["newPassword"],
  });

function mapUser(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    fullNameKy: row.full_name_ky || null,
    fullNameEn: row.full_name_en || null,
    username: row.username || null,
    email: row.email,
    phone: row.phone,
    city: row.city,
    bio: row.bio,
    avatarUrl: row.avatar_url || null,
    skills: row.skills || [],
    workerResume: parseWorkerResume(row.worker_resume),
    rating: Number(row.rating || 0),
    totalReviews: Number(row.total_reviews || 0),
    isPro: row.is_pro,
    role: row.role,
  };
}

async function loadUserById(userId) {
  const result = await pool.query(
    `SELECT u.id, u.full_name, u.full_name_ky, u.full_name_en, u.username, u.email, u.phone, u.city, u.bio, u.avatar_url, u.skills, u.worker_resume,
            u.rating, u.total_reviews, u.is_pro, u.password_hash, r.name AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1`,
    [userId],
  );

  return result.rows[0] || null;
}

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await loadUserById(req.user.sub);

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    return res.json(mapUser(user));
  } catch (error) {
    return next(error);
  }
});

router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const payload = updateProfileSchema.parse(req.body);
    const currentUser = await loadUserById(req.user.sub);

    if (!currentUser) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    const nextProfile = {
      fullName: payload.fullName ?? currentUser.full_name,
      fullNameKy: payload.fullNameKy === undefined ? currentUser.full_name_ky : payload.fullNameKy,
      fullNameEn: payload.fullNameEn === undefined ? currentUser.full_name_en : payload.fullNameEn,
      email: payload.email === undefined ? currentUser.email : payload.email,
      phone: payload.phone === undefined ? currentUser.phone : payload.phone,
      city: payload.city === undefined ? currentUser.city : payload.city,
      bio: payload.bio === undefined ? currentUser.bio : payload.bio,
      avatarUrl: payload.avatarUrl === undefined ? currentUser.avatar_url : payload.avatarUrl,
      skills: payload.skills === undefined ? currentUser.skills || [] : payload.skills,
      workerResume:
        payload.workerResume === undefined
          ? parseWorkerResume(currentUser.worker_resume)
          : payload.workerResume,
    };

    if (!nextProfile.email && !nextProfile.phone) {
      return res.status(400).json({ message: "Укажите email или phone" });
    }

    if (currentUser.role === "worker" && !nextProfile.avatarUrl) {
      return res.status(400).json({ message: "Для профиля исполнителя нужно добавить фото" });
    }

    if (nextProfile.email) {
      const emailExists = await pool.query(
        "SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id <> $2 LIMIT 1",
        [nextProfile.email, req.user.sub],
      );
      if (emailExists.rowCount) {
        return res.status(409).json({ message: "Пользователь с таким email уже существует" });
      }
    }

    if (nextProfile.phone) {
      const phoneExists = await pool.query(
        "SELECT id FROM users WHERE phone = $1 AND id <> $2 LIMIT 1",
        [nextProfile.phone, req.user.sub],
      );
      if (phoneExists.rowCount) {
        return res.status(409).json({ message: "Пользователь с таким phone уже существует" });
      }
    }

    await pool.query(
      `UPDATE users
       SET full_name = $1,
           full_name_ky = $2,
           full_name_en = $3,
           email = $4,
           phone = $5,
           city = $6,
           bio = $7,
           avatar_url = $8,
           skills = $9,
           worker_resume = $10,
           updated_at = NOW()
       WHERE id = $11`,
      [
        nextProfile.fullName,
        nextProfile.fullNameKy,
        nextProfile.fullNameEn,
        nextProfile.email,
        nextProfile.phone,
        nextProfile.city,
        nextProfile.bio,
        nextProfile.avatarUrl,
        nextProfile.skills,
        currentUser.role === "worker" ? serializeWorkerResume(nextProfile.workerResume) : serializeWorkerResume(),
        req.user.sub,
      ],
    );

    const updatedUser = await loadUserById(req.user.sub);
    return res.json(mapUser(updatedUser));
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({ message: "Пользователь с таким email или phone уже существует" });
    }
    return next(error);
  }
});

router.patch("/me/password", requireAuth, async (req, res, next) => {
  try {
    const payload = updatePasswordSchema.parse(req.body);
    const currentUser = await loadUserById(req.user.sub);

    if (!currentUser) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    const isValidPassword = await bcrypt.compare(payload.currentPassword, currentUser.password_hash || "");
    if (!isValidPassword) {
      return res.status(400).json({ message: "Текущий пароль указан неверно" });
    }

    const nextPasswordHash = await bcrypt.hash(payload.newPassword, 10);
    await pool.query(
      `UPDATE users
       SET password_hash = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [nextPasswordHash, req.user.sub],
    );

    return res.json({ message: "Пароль обновлен" });
  } catch (error) {
    return next(error);
  }
});

router.get("/", requireAuth, requireRoles("admin"), async (req, res, next) => {
  try {
    const filters = z
      .object({
        q: z.string().min(1).max(120).optional(),
        role: z.enum(["admin", "customer", "worker"]).optional(),
        city: z.string().min(2).max(120).optional(),
        limit: z.coerce.number().int().positive().max(500).optional(),
      })
      .parse(req.query);

    const values = [];
    const where = [];

    if (filters.q) {
      values.push(`%${filters.q.toLowerCase()}%`);
      where.push(`(
        LOWER(u.full_name) LIKE $${values.length}
        OR LOWER(COALESCE(u.email, '')) LIKE $${values.length}
        OR LOWER(COALESCE(u.phone, '')) LIKE $${values.length}
      )`);
    }

    if (filters.role) {
      values.push(filters.role);
      where.push(`r.name = $${values.length}`);
    }

    if (filters.city) {
      values.push(filters.city);
      where.push(`LOWER(COALESCE(u.city, '')) = LOWER($${values.length})`);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const limit = filters.limit || 200;

    const result = await pool.query(
      `SELECT u.id, u.full_name, u.full_name_ky, u.full_name_en, u.username, u.email, u.phone, u.city, u.bio, u.avatar_url, u.skills, u.worker_resume, u.rating,
              u.total_reviews, u.is_pro, u.created_at, r.name AS role
       FROM users u
       JOIN roles r ON r.id = u.role_id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT ${limit}`,
      values,
    );

    return res.json(
      result.rows.map((row) => ({
        ...mapUser(row),
        createdAt: row.created_at,
      })),
    );
  } catch (error) {
    return next(error);
  }
});

module.exports = { usersRoutes: router };
