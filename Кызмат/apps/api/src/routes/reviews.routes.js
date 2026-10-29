const { Router } = require("express");
const { z } = require("zod");
const { pool } = require("../db/pool");
const { requireAuth, requireRoles } = require("../middleware/auth");

const router = Router();

const createReviewSchema = z.object({
  jobId: z.string().uuid(),
  revieweeId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1500).optional(),
});

router.post("/", requireAuth, requireRoles("customer"), async (req, res, next) => {
  try {
    const payload = createReviewSchema.parse(req.body);

    if (payload.revieweeId === req.user.sub) {
      return res.status(400).json({ message: "Нельзя оставить отзыв самому себе" });
    }

    const jobResult = await pool.query(
      "SELECT id, customer_id, worker_id, status FROM jobs WHERE id = $1",
      [payload.jobId],
    );

    if (!jobResult.rowCount) {
      return res.status(404).json({ message: "Заказ не найден" });
    }

    const job = jobResult.rows[0];
    const canReview =
      job.status === "completed" &&
      job.customer_id === req.user.sub &&
      job.worker_id &&
      job.worker_id === payload.revieweeId;

    if (!canReview) {
      return res.status(403).json({ message: "Отзыв исполнителю может оставить только заказчик после завершения заказа" });
    }

    const reviewResult = await pool.query(
      `INSERT INTO reviews (job_id, reviewer_id, reviewee_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [payload.jobId, req.user.sub, payload.revieweeId, payload.rating, payload.comment || null],
    );

    await pool.query(
      `UPDATE users
       SET rating = COALESCE((SELECT AVG(rating)::numeric(3, 2) FROM reviews WHERE reviewee_id = $1), 0),
           total_reviews = (SELECT COUNT(*)::int FROM reviews WHERE reviewee_id = $1),
           updated_at = NOW()
       WHERE id = $1`,
      [payload.revieweeId],
    );

    const ratingResult = await pool.query(
      "SELECT rating, total_reviews FROM users WHERE id = $1",
      [payload.revieweeId],
    );

    return res.status(201).json({
      ...reviewResult.rows[0],
      workerRating: Number(ratingResult.rows[0]?.rating || 0),
      workerReviews: Number(ratingResult.rows[0]?.total_reviews || 0),
    });
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({ message: "Вы уже оставили отзыв по этому заказу" });
    }
    return next(error);
  }
});

module.exports = { reviewsRoutes: router };
