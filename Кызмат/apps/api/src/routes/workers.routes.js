const { Router } = require("express");
const { z } = require("zod");
const { pool } = require("../db/pool");
const { parseWorkerResume } = require("../utils/worker-resume");

const router = Router();

const filtersSchema = z.object({
  q: z.string().min(1).max(100).optional(),
  city: z.string().min(2).max(120).optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  sort: z.enum(["recommended", "rating", "reviews", "jobs", "name"]).optional(),
});

function mapWorkerSummary(worker) {
  return {
    id: worker.id,
    fullName: worker.full_name,
    fullNameKy: worker.full_name_ky || null,
    fullNameEn: worker.full_name_en || null,
    city: worker.city,
    bio: worker.bio,
    avatarUrl: worker.avatar_url || null,
    skills: worker.skills || [],
    workerResume: parseWorkerResume(worker.worker_resume),
    rating: Number(worker.rating || 0),
    totalReviews: Number(worker.total_reviews || 0),
    isPro: worker.is_pro,
    completedJobs: Number(worker.completed_jobs || 0),
    directions: Array.isArray(worker.directions) ? worker.directions.filter(Boolean) : [],
  };
}

function resolveSortOrder(sort) {
  switch (sort) {
    case "rating":
      return "u.rating DESC, u.total_reviews DESC, COUNT(resp.id) DESC, u.is_pro DESC, u.full_name ASC";
    case "reviews":
      return "u.total_reviews DESC, u.rating DESC, COUNT(resp.id) DESC, u.is_pro DESC, u.full_name ASC";
    case "jobs":
      return "COUNT(resp.id) DESC, u.rating DESC, u.total_reviews DESC, u.is_pro DESC, u.full_name ASC";
    case "name":
      return "u.full_name ASC, u.is_pro DESC, u.rating DESC, u.total_reviews DESC";
    case "recommended":
    default:
      return "u.is_pro DESC, u.rating DESC, u.total_reviews DESC, COUNT(resp.id) DESC, u.full_name ASC";
  }
}

async function loadWorkerDirections(workerIds) {
  if (!workerIds.length) {
    return {};
  }

  const placeholders = workerIds.map((_, index) => `$${index + 1}`).join(", ");
  const result = await pool.query(
    `SELECT resp.worker_id, c.name
     FROM responses resp
     JOIN jobs j ON j.id = resp.job_id
     JOIN categories c ON c.id = j.category_id
     WHERE resp.worker_id IN (${placeholders})
     GROUP BY resp.worker_id, c.name
     ORDER BY c.name ASC`,
    workerIds,
  );

  return result.rows.reduce((accumulator, row) => {
    if (!accumulator[row.worker_id]) {
      accumulator[row.worker_id] = [];
    }

    if (accumulator[row.worker_id].length < 6) {
      accumulator[row.worker_id].push(row.name);
    }

    return accumulator;
  }, {});
}

router.get("/", async (req, res, next) => {
  try {
    const filters = filtersSchema.parse(req.query);
    const values = [];
    const where = ["r.name = 'worker'"];
    const orderBy = resolveSortOrder(filters.sort);

    if (filters.q) {
      values.push(`%${filters.q.toLowerCase()}%`);
      where.push(`(
        LOWER(u.full_name) LIKE $${values.length}
        OR LOWER(COALESCE(u.bio, '')) LIKE $${values.length}
        OR LOWER(COALESCE(CAST(u.skills AS text), '')) LIKE $${values.length}
        OR LOWER(COALESCE(u.worker_resume, '')) LIKE $${values.length}
      )`);
    }

    if (filters.city) {
      values.push(filters.city);
      where.push(`LOWER(u.city) = LOWER($${values.length})`);
    }

    if (typeof filters.minRating === "number") {
      values.push(filters.minRating);
      where.push(`COALESCE(u.rating, 0) >= $${values.length}`);
    }

    if (filters.categoryId) {
      values.push(filters.categoryId);
      where.push(`u.id IN (
        SELECT DISTINCT resp.worker_id
        FROM responses resp
        JOIN jobs j ON j.id = resp.job_id
        WHERE j.category_id = $${values.length}
      )`);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT u.id, u.full_name, u.full_name_ky, u.full_name_en, u.city, u.bio, u.avatar_url, u.skills, u.worker_resume, u.rating, u.total_reviews, u.is_pro,
              COUNT(resp.id)::int AS completed_jobs
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN responses resp ON resp.worker_id = u.id AND resp.status = 'accepted'
       ${whereClause}
       GROUP BY u.id, u.full_name, u.full_name_ky, u.full_name_en, u.city, u.bio, u.avatar_url, u.skills, u.worker_resume, u.rating, u.total_reviews, u.is_pro
       ORDER BY ${orderBy}
       LIMIT 200`,
      values,
    );

    const directionsByWorkerId = await loadWorkerDirections(result.rows.map((row) => row.id));

    return res.json(
      result.rows.map((row) =>
        mapWorkerSummary({
          ...row,
          directions: directionsByWorkerId[row.id] || [],
        }),
      ),
    );
  } catch (error) {
    return next(error);
  }
});

router.get("/:workerId", async (req, res, next) => {
  try {
    const { workerId } = z.object({ workerId: z.string().uuid() }).parse(req.params);

    const workerResult = await pool.query(
      `SELECT u.id, u.full_name, u.full_name_ky, u.full_name_en, u.city, u.bio, u.avatar_url, u.skills, u.worker_resume, u.rating, u.total_reviews, u.is_pro,
              COUNT(resp.id)::int AS completed_jobs
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN responses resp ON resp.worker_id = u.id AND resp.status = 'accepted'
       WHERE u.id = $1 AND r.name = 'worker'
       GROUP BY u.id, u.full_name, u.full_name_ky, u.full_name_en, u.city, u.bio, u.avatar_url, u.skills, u.worker_resume, u.rating, u.total_reviews, u.is_pro`,
      [workerId],
    );

    if (!workerResult.rowCount) {
      return res.status(404).json({ message: "Исполнитель не найден" });
    }

    const directionsByWorkerId = await loadWorkerDirections([workerId]);

    const reviewsResult = await pool.query(
      `SELECT rv.id, rv.rating, rv.comment, rv.created_at, reviewer.full_name AS reviewer_name,
              reviewer.full_name_ky AS reviewer_name_ky, reviewer.full_name_en AS reviewer_name_en
       FROM reviews rv
       JOIN users reviewer ON reviewer.id = rv.reviewer_id
       WHERE rv.reviewee_id = $1
       ORDER BY rv.created_at DESC
       LIMIT 20`,
      [workerId],
    );

    const worker = workerResult.rows[0];
    return res.json({
      ...mapWorkerSummary({
        ...worker,
        directions: directionsByWorkerId[worker.id] || [],
      }),
      reviews: reviewsResult.rows,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = { workersRoutes: router };
