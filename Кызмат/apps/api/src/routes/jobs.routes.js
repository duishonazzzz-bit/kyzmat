const { Router } = require("express");
const { z } = require("zod");
const { pool } = require("../db/pool");
const { requireAuth, requireRoles, optionalAuth } = require("../middleware/auth");

const router = Router();

const listFiltersSchema = z.object({
  q: z.string().min(1).max(120).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  city: z.string().min(2).max(120).optional(),
  minBudget: z.coerce.number().nonnegative().optional(),
  maxBudget: z.coerce.number().nonnegative().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  jobType: z.enum(["order", "vacancy"]).optional(),
  status: z.enum(["open", "in_progress", "completed", "cancelled"]).optional(),
  customerId: z.string().uuid().optional(),
  workerId: z.string().uuid().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(500).optional(),
  sort: z.enum(["recent", "budget_asc", "budget_desc", "urgent_first"]).optional(),
});

const createJobSchema = z.object({
  jobType: z.enum(["order", "vacancy"]).default("order"),
  title: z.string().min(5).max(140),
  description: z.string().min(10).max(4000),
  budget: z.coerce.number().positive().max(100000000),
  categoryId: z.coerce.number().int().positive(),
  city: z.string().min(2).max(120),
  address: z.string().min(5).max(240),
  locationNote: z.string().max(500).optional(),
  dueDate: z.string().date().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(500).optional(),
  isUrgent: z.coerce.boolean().optional(),
  escrowRequired: z.coerce.boolean().optional(),
});

const respondSchema = z.object({
  jobId: z.string().uuid(),
  message: z.string().max(1200).optional(),
  proposedPrice: z.coerce.number().positive().max(100000000),
  etaDays: z.coerce.number().int().positive().max(365).optional(),
});

const selectWorkerSchema = z.object({
  workerId: z.string().uuid(),
});

const updateStatusSchema = z.object({
  status: z.enum(["open", "in_progress", "completed", "cancelled"]),
});

const updateLiveStatusSchema = z.object({
  status: z.enum(["idle", "en_route", "arrived"]),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});

function buildSorting(sort) {
  switch (sort) {
    case "budget_asc":
      return "j.budget ASC, j.created_at DESC";
    case "budget_desc":
      return "j.budget DESC, j.created_at DESC";
    case "urgent_first":
      return "j.is_urgent DESC, j.created_at DESC";
    default:
      return "j.created_at DESC";
  }
}

router.get("/", async (req, res, next) => {
  try {
    const filters = listFiltersSchema.parse(req.query);
    const values = [];
    const where = [];

    if (filters.q) {
      values.push(`%${filters.q.toLowerCase()}%`);
      where.push(`(
        LOWER(j.title) LIKE $${values.length}
        OR LOWER(j.description) LIKE $${values.length}
      )`);
    }

    if (filters.categoryId) {
      values.push(filters.categoryId);
      where.push(`j.category_id = $${values.length}`);
    }

    if (filters.city) {
      values.push(filters.city);
      where.push(`LOWER(j.city) = LOWER($${values.length})`);
    }

    if (typeof filters.minBudget === "number") {
      values.push(filters.minBudget);
      where.push(`j.budget >= $${values.length}`);
    }

    if (typeof filters.maxBudget === "number") {
      values.push(filters.maxBudget);
      where.push(`j.budget <= $${values.length}`);
    }

    if (filters.status) {
      values.push(filters.status);
      where.push(`j.status = $${values.length}`);
    }

    if (filters.jobType) {
      values.push(filters.jobType);
      where.push(`j.job_type = $${values.length}`);
    }

    if (filters.customerId) {
      values.push(filters.customerId);
      where.push(`j.customer_id = $${values.length}`);
    }

    if (filters.workerId) {
      values.push(filters.workerId);
      where.push(`j.worker_id = $${values.length}`);
    }

    if (typeof filters.minRating === "number") {
      values.push(filters.minRating);
      where.push(`COALESCE(cust.rating, 0) >= $${values.length}`);
    }

    if (
      typeof filters.lat === "number" &&
      typeof filters.lng === "number" &&
      typeof filters.radiusKm === "number"
    ) {
      values.push(filters.lat);
      values.push(filters.lng);
      values.push(filters.lat);
      values.push(filters.radiusKm);
      where.push(
        `j.latitude IS NOT NULL
         AND j.longitude IS NOT NULL
         AND (6371 * acos(
           cos(radians($${values.length - 3}))
           * cos(radians(j.latitude))
           * cos(radians(j.longitude) - radians($${values.length - 2}))
           + sin(radians($${values.length - 1}))
           * sin(radians(j.latitude))
         )) <= $${values.length}`,
      );
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const orderBy = buildSorting(filters.sort);

    const result = await pool.query(
      `SELECT j.id, j.job_type, j.title, j.description, j.budget, j.city, j.address, j.location_note, j.latitude, j.longitude,
              j.worker_live_status, j.worker_live_latitude, j.worker_live_longitude, j.worker_live_updated_at, j.radius_km,
              j.due_date, j.status, j.is_urgent, j.escrow_status, j.created_at,
              c.id AS category_id, c.name AS category_name,
              cust.id AS customer_id, cust.full_name AS customer_name, cust.full_name_ky AS customer_name_ky, cust.full_name_en AS customer_name_en, cust.rating AS customer_rating,
              worker.id AS worker_id, worker.full_name AS worker_name, worker.full_name_ky AS worker_name_ky, worker.full_name_en AS worker_name_en,
              worker.rating AS worker_rating, worker.total_reviews AS worker_reviews,
              COALESCE(resp.responses_count, 0)::int AS responses_count
       FROM jobs j
       JOIN categories c ON c.id = j.category_id
       JOIN users cust ON cust.id = j.customer_id
       LEFT JOIN users worker ON worker.id = j.worker_id
       LEFT JOIN (
         SELECT job_id, COUNT(*)::int AS responses_count
         FROM responses
         GROUP BY job_id
       ) resp ON resp.job_id = j.id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT 200`,
      values,
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

router.get("/:jobId/responses", requireAuth, requireRoles("customer", "admin"), async (req, res, next) => {
  try {
    const { jobId } = z.object({ jobId: z.string().uuid() }).parse(req.params);

    const jobResult = await pool.query("SELECT id, customer_id FROM jobs WHERE id = $1", [jobId]);
    if (!jobResult.rowCount) {
      return res.status(404).json({ message: "Заказ не найден" });
    }

    const job = jobResult.rows[0];
    const isOwner = job.customer_id === req.user.sub;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Только заказчик может смотреть отклики" });
    }

    const responsesResult = await pool.query(
      `SELECT r.id, r.job_id, r.worker_id, r.message, r.proposed_price, r.eta_days, r.status, r.created_at,
              u.full_name AS worker_name, u.full_name_ky AS worker_name_ky, u.full_name_en AS worker_name_en,
              u.rating AS worker_rating, u.total_reviews AS worker_reviews, u.city AS worker_city
       FROM responses r
       JOIN users u ON u.id = r.worker_id
       WHERE r.job_id = $1
       ORDER BY CASE WHEN r.status = 'accepted' THEN 0 ELSE 1 END, r.created_at DESC`,
      [jobId],
    );

    return res.json(responsesResult.rows);
  } catch (error) {
    return next(error);
  }
});

router.get("/:jobId", optionalAuth, async (req, res, next) => {
  try {
    const { jobId } = z.object({ jobId: z.string().uuid() }).parse(req.params);

    const jobResult = await pool.query(
      `SELECT j.id, j.job_type, j.title, j.description, j.budget, j.city, j.address, j.location_note, j.latitude, j.longitude,
              j.worker_live_status, j.worker_live_latitude, j.worker_live_longitude, j.worker_live_updated_at, j.radius_km,
              j.due_date, j.status, j.is_urgent, j.escrow_status, j.created_at,
              c.id AS category_id, c.name AS category_name,
              cust.id AS customer_id, cust.full_name AS customer_name, cust.full_name_ky AS customer_name_ky, cust.full_name_en AS customer_name_en, cust.rating AS customer_rating,
              worker.id AS worker_id, worker.full_name AS worker_name, worker.full_name_ky AS worker_name_ky, worker.full_name_en AS worker_name_en,
              worker.rating AS worker_rating, worker.total_reviews AS worker_reviews
       FROM jobs j
       JOIN categories c ON c.id = j.category_id
       JOIN users cust ON cust.id = j.customer_id
       LEFT JOIN users worker ON worker.id = j.worker_id
       WHERE j.id = $1`,
      [jobId],
    );

    if (!jobResult.rowCount) {
      return res.status(404).json({ message: "Заказ не найден" });
    }

    const job = jobResult.rows[0];
    const isAuthenticated = Boolean(req.user?.sub);
    const isAdmin = req.user?.role === "admin";
    const isOwner = req.user?.sub === job.customer_id;
    const isAssignedWorker = req.user?.sub === job.worker_id;

    let responses = [];
    let customerReview = null;

    if (isAuthenticated && (isAdmin || isOwner)) {
      const responsesResult = await pool.query(
        `SELECT r.id, r.worker_id, r.message, r.proposed_price, r.eta_days, r.status, r.created_at,
                u.full_name AS worker_name, u.full_name_ky AS worker_name_ky, u.full_name_en AS worker_name_en,
                u.city AS worker_city, u.rating AS worker_rating, u.total_reviews AS worker_reviews
         FROM responses r
         JOIN users u ON u.id = r.worker_id
         WHERE r.job_id = $1
         ORDER BY CASE WHEN r.status = 'accepted' THEN 0 ELSE 1 END, r.created_at DESC`,
        [jobId],
      );
      responses = responsesResult.rows;
    } else if (isAuthenticated && req.user.role === "worker") {
      const responsesResult = await pool.query(
        `SELECT r.id, r.worker_id, r.message, r.proposed_price, r.eta_days, r.status, r.created_at,
                u.full_name AS worker_name, u.full_name_ky AS worker_name_ky, u.full_name_en AS worker_name_en,
                u.city AS worker_city, u.rating AS worker_rating, u.total_reviews AS worker_reviews
         FROM responses r
         JOIN users u ON u.id = r.worker_id
         WHERE r.job_id = $1 AND r.worker_id = $2`,
        [jobId, req.user.sub],
      );
      responses = responsesResult.rows;
    }

    if (isAuthenticated && (isOwner || isAdmin)) {
      const reviewResult = await pool.query(
        `SELECT id, job_id, reviewer_id, reviewee_id, rating, comment, created_at
         FROM reviews
         WHERE job_id = $1 AND reviewer_id = $2
         LIMIT 1`,
        [jobId, req.user.sub],
      );
      customerReview = reviewResult.rows[0] || null;
    }

    return res.json({
      ...job,
      responses,
      customerReview,
      canRespond: isAuthenticated && req.user.role === "worker" && job.status === "open" && !isOwner,
      canSelectWorker: isAuthenticated && (isOwner || isAdmin) && job.status === "open",
      canUpdateStatus: isAuthenticated && (isOwner || isAssignedWorker || isAdmin),
      canManageLiveStatus: isAuthenticated && job.status === "in_progress" && (isAssignedWorker || isAdmin),
      canReviewWorker: isAuthenticated && req.user.role === "customer" && isOwner && job.status === "completed" && Boolean(job.worker_id) && !customerReview,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireAuth, requireRoles("customer", "admin"), async (req, res, next) => {
  try {
    const payload = createJobSchema.parse(req.body);

    const result = await pool.query(
      `INSERT INTO jobs (
        customer_id,
        category_id,
        job_type,
        title,
        description,
        budget,
        city,
        address,
        location_note,
        due_date,
        latitude,
        longitude,
        radius_km,
        is_urgent,
        escrow_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        req.user.sub,
        payload.categoryId,
        payload.jobType,
        payload.title,
        payload.description,
        payload.budget,
        payload.city,
        payload.address,
        payload.locationNote || null,
        payload.dueDate || null,
        payload.latitude || null,
        payload.longitude || null,
        payload.radiusKm || null,
        payload.isUrgent || false,
        payload.escrowRequired ? "reserved" : "not_required",
      ],
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.post(
  "/respond",
  requireAuth,
  requireRoles("worker", "admin"),
  async (req, res, next) => {
    try {
      const payload = respondSchema.parse(req.body);

      const jobResult = await pool.query("SELECT id, status, customer_id FROM jobs WHERE id = $1", [payload.jobId]);

      if (!jobResult.rowCount) {
        return res.status(404).json({ message: "Заказ не найден" });
      }

      if (jobResult.rows[0].status !== "open") {
        return res.status(400).json({ message: "Отклик возможен только для открытого заказа" });
      }

      if (jobResult.rows[0].customer_id === req.user.sub) {
        return res.status(400).json({ message: "Нельзя откликнуться на собственный заказ" });
      }

      const result = await pool.query(
        `INSERT INTO responses (job_id, worker_id, message, proposed_price, eta_days)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          payload.jobId,
          req.user.sub,
          payload.message || null,
          payload.proposedPrice,
          payload.etaDays || null,
        ],
      );

      return res.status(201).json(result.rows[0]);
    } catch (error) {
      if (error?.code === "23505") {
        return res.status(409).json({ message: "Вы уже откликались на этот заказ" });
      }
      return next(error);
    }
  },
);

router.post(
  "/:jobId/select-worker",
  requireAuth,
  requireRoles("customer", "admin"),
  async (req, res, next) => {
    try {
      const { jobId } = z.object({ jobId: z.string().uuid() }).parse(req.params);
      const payload = selectWorkerSchema.parse(req.body);

      const jobResult = await pool.query(
        "SELECT id, customer_id, status FROM jobs WHERE id = $1",
        [jobId],
      );

      if (!jobResult.rowCount) {
        return res.status(404).json({ message: "Заказ не найден" });
      }

      const job = jobResult.rows[0];
      const isOwner = job.customer_id === req.user.sub;
      const isAdmin = req.user.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Только заказчик может выбрать исполнителя" });
      }

      if (job.status !== "open") {
        return res.status(400).json({ message: "Выбор исполнителя возможен только у открытого заказа" });
      }

      const responseResult = await pool.query(
        "SELECT id FROM responses WHERE job_id = $1 AND worker_id = $2",
        [jobId, payload.workerId],
      );

      if (!responseResult.rowCount) {
        return res.status(404).json({ message: "У указанного исполнителя нет отклика на этот заказ" });
      }

      await pool.query(
        `UPDATE responses
         SET status = CASE WHEN worker_id = $1 THEN 'accepted' ELSE 'rejected' END
         WHERE job_id = $2`,
        [payload.workerId, jobId],
      );

      const updateResult = await pool.query(
        `UPDATE jobs
         SET worker_id = $1,
             status = 'in_progress',
             worker_live_status = 'idle',
             worker_live_latitude = NULL,
             worker_live_longitude = NULL,
             worker_live_updated_at = NULL,
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [payload.workerId, jobId],
      );

      return res.json(updateResult.rows[0]);
    } catch (error) {
      return next(error);
    }
  },
);

router.patch("/:jobId/status", requireAuth, async (req, res, next) => {
  try {
    const { jobId } = z.object({ jobId: z.string().uuid() }).parse(req.params);
    const payload = updateStatusSchema.parse(req.body);

    const jobResult = await pool.query(
      `SELECT id, customer_id, worker_id, status, escrow_status,
              worker_live_status, worker_live_latitude, worker_live_longitude, worker_live_updated_at
       FROM jobs
       WHERE id = $1`,
      [jobId],
    );

    if (!jobResult.rowCount) {
      return res.status(404).json({ message: "Заказ не найден" });
    }

    const job = jobResult.rows[0];
    const isAdmin = req.user.role === "admin";
    const isOwner = req.user.sub === job.customer_id;
    const isAssignedWorker = req.user.sub === job.worker_id;

    if (!isAdmin && !isOwner && !isAssignedWorker) {
      return res.status(403).json({ message: "Недостаточно прав для изменения статуса" });
    }

    if (payload.status === "completed") {
      if (!isAdmin && !isOwner && !isAssignedWorker) {
        return res.status(403).json({ message: "Недостаточно прав" });
      }
      if (job.status !== "in_progress") {
        return res.status(400).json({ message: "Завершить можно только заказ в работе" });
      }
    }

    if (payload.status === "cancelled") {
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: "Только заказчик или админ могут отменить заказ" });
      }
      if (!["open", "in_progress"].includes(job.status)) {
        return res.status(400).json({ message: "Этот заказ нельзя отменить в текущем статусе" });
      }
    }

    if (payload.status === "open" || payload.status === "in_progress") {
      if (!isAdmin) {
        return res.status(403).json({ message: "Только администратор может установить этот статус вручную" });
      }
    }

    const nextEscrowStatus =
      payload.status === "completed" && job.escrow_status === "reserved"
        ? "released"
        : job.escrow_status;

    const shouldResetLiveTracking = payload.status === "completed" || payload.status === "cancelled";
    const nextWorkerLiveStatus = shouldResetLiveTracking ? "idle" : job.worker_live_status || "idle";
    const nextWorkerLiveLatitude = shouldResetLiveTracking ? null : job.worker_live_latitude;
    const nextWorkerLiveLongitude = shouldResetLiveTracking ? null : job.worker_live_longitude;
    const nextWorkerLiveUpdatedAt = shouldResetLiveTracking ? null : job.worker_live_updated_at;

    const updateResult = await pool.query(
      `UPDATE jobs
       SET status = $1,
           escrow_status = $2,
           worker_live_status = $3,
           worker_live_latitude = $4,
           worker_live_longitude = $5,
           worker_live_updated_at = $6,
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        payload.status,
        nextEscrowStatus,
        nextWorkerLiveStatus,
        nextWorkerLiveLatitude,
        nextWorkerLiveLongitude,
        nextWorkerLiveUpdatedAt,
        jobId,
      ],
    );

    return res.json(updateResult.rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.patch("/:jobId/live-status", requireAuth, async (req, res, next) => {
  try {
    const { jobId } = z.object({ jobId: z.string().uuid() }).parse(req.params);
    const payload = updateLiveStatusSchema.parse(req.body);

    const jobResult = await pool.query(
      `SELECT id, customer_id, worker_id, status, worker_live_latitude, worker_live_longitude
       FROM jobs
       WHERE id = $1`,
      [jobId],
    );

    if (!jobResult.rowCount) {
      return res.status(404).json({ message: "Заказ не найден" });
    }

    const job = jobResult.rows[0];
    const isAdmin = req.user.role === "admin";
    const isAssignedWorker = req.user.sub === job.worker_id;

    if (!isAdmin && !isAssignedWorker) {
      return res.status(403).json({ message: "Только назначенный исполнитель может обновлять путь" });
    }

    if (job.status !== "in_progress") {
      return res.status(400).json({ message: "Обновление пути доступно только для заказа в работе" });
    }

    const hasCoordinates =
      typeof payload.latitude === "number" && Number.isFinite(payload.latitude) &&
      typeof payload.longitude === "number" && Number.isFinite(payload.longitude);

    const nextLatitude = payload.status === "idle"
      ? null
      : hasCoordinates
        ? payload.latitude
        : job.worker_live_latitude || null;
    const nextLongitude = payload.status === "idle"
      ? null
      : hasCoordinates
        ? payload.longitude
        : job.worker_live_longitude || null;
    const nextUpdatedAt = payload.status === "idle" ? null : new Date().toISOString();

    const updateResult = await pool.query(
      `UPDATE jobs
       SET worker_live_status = $1,
           worker_live_latitude = $2,
           worker_live_longitude = $3,
           worker_live_updated_at = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [payload.status, nextLatitude, nextLongitude, nextUpdatedAt, jobId],
    );

    return res.json(updateResult.rows[0]);
  } catch (error) {
    return next(error);
  }
});

module.exports = { jobsRoutes: router };
