const { Router } = require("express");
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const { pool } = require("../db/pool");
const { requireAuth, requireRoles } = require("../middleware/auth");

const router = Router();

router.use(requireAuth, requireRoles("admin"));

const roleSchema = z.enum(["admin", "customer", "worker"]);
const jobStatusSchema = z.enum(["open", "in_progress", "completed", "cancelled"]);
const escrowStatusSchema = z.enum(["not_required", "reserved", "released", "disputed"]);
const subscriptionStatusSchema = z.enum(["active", "expired", "cancelled"]);
const serviceOrderStatusSchema = z.enum(["ordered", "in_progress", "completed", "cancelled"]);
const planRoleScopeSchema = z.enum(["customer", "worker", "all"]);
const billingPeriodSchema = z.enum(["monthly", "quarterly", "yearly"]);
const serviceTargetRoleSchema = z.enum(["customer", "worker", "all"]);
const billingTypeSchema = z.enum(["one_time", "subscription_included"]);

const trimmedString = (schema) =>
  z.preprocess((value) => {
    if (typeof value === "string") {
      return value.trim();
    }

    return value;
  }, schema);

const optionalTrimmedString = (schema) =>
  z.preprocess((value) => {
    if (value === undefined) return undefined;
    if (typeof value === "string") {
      return value.trim();
    }

    return value;
  }, schema.optional());

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

const stringArraySchema = z
  .array(
    z.preprocess((value) => {
      if (typeof value === "string") {
        return value.trim();
      }

      return value;
    }, z.string().min(1).max(200)),
  )
  .max(20);

const updateAdminUserSchema = z
  .object({
    fullName: optionalTrimmedString(z.string().min(2).max(160)),
    fullNameKy: nullableTrimmedString(z.string().min(2).max(160)),
    fullNameEn: nullableTrimmedString(z.string().min(2).max(160)),
    email: nullableTrimmedString(z.string().email()),
    phone: nullableTrimmedString(z.string().min(6).max(32)),
    city: nullableTrimmedString(z.string().min(2).max(120)),
    bio: nullableTrimmedString(z.string().max(1200)),
    role: roleSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Нет данных для обновления пользователя",
  });

const updateAdminUserPasswordSchema = z.object({
  newPassword: trimmedString(z.string().min(6).max(160)),
});

const updateAdminUserBlockSchema = z.object({
  blocked: z.coerce.boolean(),
});

const updateAdminUserSubscriptionSchema = z
  .object({
    planId: z.preprocess((value) => {
      if (value === undefined || value === null || value === "") {
        return null;
      }

      const nextValue = Number(value);
      return Number.isFinite(nextValue) ? nextValue : value;
    }, z.number().int().positive().nullable()),
    endsAt: z.string().datetime().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Нет данных для обновления подписки пользователя",
  });

const updateAdminJobSchema = z
  .object({
    status: jobStatusSchema.optional(),
    escrowStatus: escrowStatusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Нет данных для обновления заказа",
  });

const createPlanSchema = z.object({
  slug: trimmedString(z.string().min(2).max(80)),
  name: trimmedString(z.string().min(2).max(140)),
  roleScope: planRoleScopeSchema,
  billingPeriod: billingPeriodSchema,
  price: z.coerce.number().nonnegative().max(100000000),
  currency: optionalTrimmedString(z.string().min(2).max(8)),
  description: trimmedString(z.string().min(10).max(1200)),
  features: stringArraySchema.default([]),
  isPro: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
});

const updatePlanSchema = z
  .object({
    slug: optionalTrimmedString(z.string().min(2).max(80)),
    name: optionalTrimmedString(z.string().min(2).max(140)),
    roleScope: planRoleScopeSchema.optional(),
    billingPeriod: billingPeriodSchema.optional(),
    price: z.coerce.number().nonnegative().max(100000000).optional(),
    currency: optionalTrimmedString(z.string().min(2).max(8)),
    description: optionalTrimmedString(z.string().min(10).max(1200)),
    features: stringArraySchema.optional(),
    isPro: z.coerce.boolean().optional(),
    isActive: z.coerce.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Нет данных для обновления тарифа",
  });

const createServiceSchema = z.object({
  slug: trimmedString(z.string().min(2).max(80)),
  name: trimmedString(z.string().min(2).max(160)),
  targetRole: serviceTargetRoleSchema,
  billingType: billingTypeSchema,
  price: z.coerce.number().nonnegative().max(100000000),
  currency: optionalTrimmedString(z.string().min(2).max(8)),
  description: trimmedString(z.string().min(10).max(1200)),
  benefits: stringArraySchema.default([]),
  isActive: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
});

const updateServiceSchema = z
  .object({
    slug: optionalTrimmedString(z.string().min(2).max(80)),
    name: optionalTrimmedString(z.string().min(2).max(160)),
    targetRole: serviceTargetRoleSchema.optional(),
    billingType: billingTypeSchema.optional(),
    price: z.coerce.number().nonnegative().max(100000000).optional(),
    currency: optionalTrimmedString(z.string().min(2).max(8)),
    description: optionalTrimmedString(z.string().min(10).max(1200)),
    benefits: stringArraySchema.optional(),
    isActive: z.coerce.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Нет данных для обновления услуги",
  });

const updateSubscriptionSchema = z
  .object({
    status: subscriptionStatusSchema.optional(),
    endsAt: z.string().datetime().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Нет данных для обновления подписки",
  });

const updateServiceOrderSchema = z.object({
  status: serviceOrderStatusSchema,
});

function mapAdminUser(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    fullNameKy: row.full_name_ky || null,
    fullNameEn: row.full_name_en || null,
    email: row.email,
    phone: row.phone,
    city: row.city,
    bio: row.bio,
    avatarUrl: row.avatar_url || null,
    skills: row.skills || [],
    rating: Number(row.rating || 0),
    totalReviews: Number(row.total_reviews || 0),
    isPro: row.is_pro,
    isBlocked: Boolean(row.is_blocked),
    role: row.role,
    createdAt: row.created_at,
    currentSubscription: row.current_plan_slug
      ? {
          planId: row.current_plan_id,
          slug: row.current_plan_slug,
          name: row.current_plan_name,
          roleScope: row.current_plan_role_scope,
          billingPeriod: row.current_plan_billing_period,
          endsAt: row.current_subscription_ends_at,
        }
      : null,
  };
}

function mapAdminJob(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    budget: Number(row.budget || 0),
    city: row.city,
    status: row.status,
    escrowStatus: row.escrow_status,
    isUrgent: row.is_urgent,
    createdAt: row.created_at,
    dueDate: row.due_date,
    category: {
      id: row.category_id,
      name: row.category_name,
    },
    customer: {
      id: row.customer_id,
      fullName: row.customer_name,
    },
    worker: row.worker_id
      ? {
          id: row.worker_id,
          fullName: row.worker_name,
        }
      : null,
    responsesCount: Number(row.responses_count || 0),
  };
}

function mapPlan(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    roleScope: row.role_scope,
    billingPeriod: row.billing_period,
    price: Number(row.price || 0),
    currency: row.currency,
    description: row.description,
    features: row.features || [],
    isPro: row.is_pro,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

function mapAdminSubscription(row) {
  return {
    id: row.id,
    status: row.status,
    amountPaid: Number(row.amount_paid || 0),
    currency: row.currency,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    user: {
      id: row.user_id,
      fullName: row.user_full_name,
      role: row.user_role,
    },
    plan: {
      id: row.plan_id,
      slug: row.plan_slug,
      name: row.plan_name,
      roleScope: row.plan_role_scope,
      billingPeriod: row.plan_billing_period,
    },
  };
}

function mapService(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    targetRole: row.target_role,
    billingType: row.billing_type,
    price: Number(row.price || 0),
    currency: row.currency,
    description: row.description,
    benefits: row.benefits || [],
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

function mapAdminServiceOrder(row) {
  return {
    id: row.id,
    status: row.status,
    price: Number(row.price || 0),
    currency: row.currency,
    note: row.note,
    createdAt: row.created_at,
    user: {
      id: row.user_id,
      fullName: row.user_full_name,
      role: row.user_role,
    },
    service: {
      id: row.service_id,
      slug: row.service_slug,
      name: row.service_name,
      targetRole: row.service_target_role,
      billingType: row.service_billing_type,
    },
  };
}

async function syncUserProFlag(userId) {
  await pool.query(
    `UPDATE user_subscriptions
     SET status = 'expired'
     WHERE user_id = $1 AND status = 'active' AND ends_at < NOW()`,
    [userId],
  );

  const activeSubscriptionResult = await pool.query(
    `SELECT COUNT(*)::int AS active_count
     FROM user_subscriptions
     WHERE user_id = $1 AND status = 'active' AND ends_at >= NOW()`,
    [userId],
  );

  const activeCount = Number(activeSubscriptionResult.rows[0]?.active_count || 0);

  await pool.query(
    `UPDATE users
     SET is_pro = $1, updated_at = NOW()
     WHERE id = $2`,
    [activeCount > 0, userId],
  );
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getSubscriptionEndDate(billingPeriod) {
  const startsAt = new Date();

  switch (billingPeriod) {
    case "quarterly":
      return addDays(startsAt, 90);
    case "yearly":
      return addDays(startsAt, 365);
    default:
      return addDays(startsAt, 30);
  }
}

async function loadActiveSubscriptionsForUsers(userIds) {
  const uniqueIds = [...new Set((userIds || []).filter(Boolean))];

  if (!uniqueIds.length) {
    return new Map();
  }

  const placeholders = uniqueIds.map((_, index) => `$${index + 1}`).join(", ");
  const result = await pool.query(
    `SELECT us.user_id, us.ends_at, sp.id AS plan_id, sp.slug, sp.name, sp.role_scope, sp.billing_period
     FROM user_subscriptions us
     JOIN subscription_plans sp ON sp.id = us.plan_id
     WHERE us.user_id IN (${placeholders})
       AND us.status = 'active'
       AND us.ends_at >= NOW()
     ORDER BY us.user_id, us.ends_at DESC, us.created_at DESC`,
    uniqueIds,
  );

  const subscriptionsByUserId = new Map();

  for (const row of result.rows) {
    if (!subscriptionsByUserId.has(row.user_id)) {
      subscriptionsByUserId.set(row.user_id, {
        current_plan_id: row.plan_id,
        current_plan_slug: row.slug,
        current_plan_name: row.name,
        current_plan_role_scope: row.role_scope,
        current_plan_billing_period: row.billing_period,
        current_subscription_ends_at: row.ends_at,
      });
    }
  }

  return subscriptionsByUserId;
}

async function loadAdminUserById(userId) {
  const result = await pool.query(
    `SELECT u.id, u.full_name, u.full_name_ky, u.full_name_en, u.email, u.phone, u.city, u.bio, u.avatar_url, u.skills,
            u.rating, u.total_reviews, u.is_pro, u.is_blocked, u.created_at, r.name AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1`,
    [userId],
  );

  const user = result.rows[0] || null;

  if (!user) {
    return null;
  }

  const subscriptionsByUserId = await loadActiveSubscriptionsForUsers([user.id]);

  return {
    ...user,
    ...(subscriptionsByUserId.get(user.id) || {}),
  };
}

async function loadAdminJobById(jobId) {
  const result = await pool.query(
    `SELECT j.id, j.title, j.description, j.budget, j.city, j.due_date, j.status,
            j.escrow_status, j.is_urgent, j.created_at,
            c.id AS category_id, c.name AS category_name,
            cust.id AS customer_id, cust.full_name AS customer_name,
            worker.id AS worker_id, worker.full_name AS worker_name,
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
     WHERE j.id = $1`,
    [jobId],
  );

  return result.rows[0] || null;
}

async function loadPlanById(planId) {
  const result = await pool.query(
    `SELECT id, slug, name, role_scope, billing_period, price, currency,
            description, features, is_pro, is_active, sort_order
     FROM subscription_plans
     WHERE id = $1`,
    [planId],
  );

  return result.rows[0] || null;
}

async function loadServiceById(serviceId) {
  const result = await pool.query(
    `SELECT id, slug, name, target_role, billing_type, price, currency,
            description, benefits, is_active, sort_order
     FROM platform_services
     WHERE id = $1`,
    [serviceId],
  );

  return result.rows[0] || null;
}

async function loadSubscriptionById(subscriptionId) {
  const result = await pool.query(
    `SELECT us.id, us.status, us.amount_paid, us.currency, us.starts_at, us.ends_at, us.created_at,
            u.id AS user_id, u.full_name AS user_full_name, r.name AS user_role,
            sp.id AS plan_id, sp.slug AS plan_slug, sp.name AS plan_name,
            sp.role_scope AS plan_role_scope, sp.billing_period AS plan_billing_period
     FROM user_subscriptions us
     JOIN users u ON u.id = us.user_id
     JOIN roles r ON r.id = u.role_id
     JOIN subscription_plans sp ON sp.id = us.plan_id
     WHERE us.id = $1`,
    [subscriptionId],
  );

  return result.rows[0] || null;
}

async function loadServiceOrderById(orderId) {
  const result = await pool.query(
    `SELECT so.id, so.status, so.price, so.currency, so.note, so.created_at,
            u.id AS user_id, u.full_name AS user_full_name, r.name AS user_role,
            ps.id AS service_id, ps.slug AS service_slug, ps.name AS service_name,
            ps.target_role AS service_target_role, ps.billing_type AS service_billing_type
     FROM service_orders so
     JOIN users u ON u.id = so.user_id
     JOIN roles r ON r.id = u.role_id
     JOIN platform_services ps ON ps.id = so.service_id
     WHERE so.id = $1`,
    [orderId],
  );

  return result.rows[0] || null;
}

router.get("/overview", async (req, res, next) => {
  try {
    const [
      usersStats,
      jobsStats,
      responsesStats,
      messagesStats,
      disputesStats,
      plansStats,
      subscriptionsStats,
      servicesStats,
      recentJobs,
      recentSubscriptions,
      recentServiceOrders,
    ] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)::int AS total_users,
           COUNT(*) FILTER (WHERE r.name = 'worker')::int AS workers,
           COUNT(*) FILTER (WHERE r.name = 'customer')::int AS customers,
           COUNT(*) FILTER (WHERE r.name = 'admin')::int AS admins,
           COUNT(*) FILTER (WHERE u.is_pro = TRUE)::int AS pro_users
         FROM users u
         JOIN roles r ON r.id = u.role_id`,
      ),
      pool.query(
        `SELECT
           COUNT(*)::int AS total_jobs,
           COUNT(*) FILTER (WHERE status = 'open')::int AS open_jobs,
           COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress_jobs,
           COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_jobs,
           COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled_jobs
         FROM jobs`,
      ),
      pool.query("SELECT COUNT(*)::int AS total_responses FROM responses"),
      pool.query("SELECT COUNT(*)::int AS total_messages FROM messages"),
      pool.query("SELECT COUNT(*)::int AS open_disputes FROM disputes WHERE status = 'open'"),
      pool.query(
        `SELECT
           COUNT(*)::int AS total_plans,
           COUNT(*) FILTER (WHERE is_active = TRUE)::int AS active_plans
         FROM subscription_plans`,
      ),
      pool.query(
        `SELECT
           COUNT(*)::int AS total_subscriptions,
           COUNT(*) FILTER (WHERE status = 'active' AND ends_at >= NOW())::int AS active_subscriptions,
           COALESCE(SUM(amount_paid), 0)::numeric AS total_subscription_revenue
         FROM user_subscriptions`,
      ),
      pool.query(
        `SELECT
           (SELECT COUNT(*)::int FROM platform_services) AS total_services,
           (SELECT COUNT(*)::int FROM platform_services WHERE is_active = TRUE) AS active_services,
           (SELECT COUNT(*)::int FROM service_orders) AS total_service_orders,
           (SELECT COUNT(*)::int FROM service_orders WHERE status = 'in_progress') AS service_orders_in_progress,
           (SELECT COALESCE(SUM(price), 0)::numeric FROM service_orders) AS total_service_revenue`,
      ),
      pool.query(
        `SELECT j.id, j.title, j.status, j.budget, j.city, j.created_at,
                c.name AS category_name,
                cust.full_name AS customer_name,
                worker.full_name AS worker_name
         FROM jobs j
         JOIN categories c ON c.id = j.category_id
         JOIN users cust ON cust.id = j.customer_id
         LEFT JOIN users worker ON worker.id = j.worker_id
         ORDER BY j.created_at DESC
         LIMIT 8`,
      ),
      pool.query(
        `SELECT us.id, us.status, us.amount_paid, us.currency, us.starts_at, us.ends_at, us.created_at,
                u.id AS user_id, u.full_name AS user_full_name, r.name AS user_role,
                sp.id AS plan_id, sp.slug AS plan_slug, sp.name AS plan_name,
                sp.role_scope AS plan_role_scope, sp.billing_period AS plan_billing_period
         FROM user_subscriptions us
         JOIN users u ON u.id = us.user_id
         JOIN roles r ON r.id = u.role_id
         JOIN subscription_plans sp ON sp.id = us.plan_id
         ORDER BY us.created_at DESC
         LIMIT 8`,
      ),
      pool.query(
        `SELECT so.id, so.status, so.price, so.currency, so.note, so.created_at,
                u.id AS user_id, u.full_name AS user_full_name, r.name AS user_role,
                ps.id AS service_id, ps.slug AS service_slug, ps.name AS service_name,
                ps.target_role AS service_target_role, ps.billing_type AS service_billing_type
         FROM service_orders so
         JOIN users u ON u.id = so.user_id
         JOIN roles r ON r.id = u.role_id
         JOIN platform_services ps ON ps.id = so.service_id
         ORDER BY so.created_at DESC
         LIMIT 8`,
      ),
    ]);

    return res.json({
      users: usersStats.rows[0],
      jobs: jobsStats.rows[0],
      activity: {
        totalResponses: responsesStats.rows[0].total_responses,
        totalMessages: messagesStats.rows[0].total_messages,
        openDisputes: disputesStats.rows[0].open_disputes,
      },
      monetization: {
        totalPlans: plansStats.rows[0].total_plans,
        activePlans: plansStats.rows[0].active_plans,
        totalSubscriptions: subscriptionsStats.rows[0].total_subscriptions,
        activeSubscriptions: subscriptionsStats.rows[0].active_subscriptions,
        totalSubscriptionRevenue: Number(subscriptionsStats.rows[0].total_subscription_revenue || 0),
        totalServices: servicesStats.rows[0].total_services,
        activeServices: servicesStats.rows[0].active_services,
        totalServiceOrders: servicesStats.rows[0].total_service_orders,
        serviceOrdersInProgress: servicesStats.rows[0].service_orders_in_progress,
        totalServiceRevenue: Number(servicesStats.rows[0].total_service_revenue || 0),
      },
      recentJobs: recentJobs.rows,
      recentSubscriptions: recentSubscriptions.rows.map(mapAdminSubscription),
      recentServiceOrders: recentServiceOrders.rows.map(mapAdminServiceOrder),
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const filters = z
      .object({
        q: z.string().min(1).max(120).optional(),
        role: roleSchema.optional(),
        city: z.string().min(2).max(120).optional(),
        limit: z.coerce.number().int().positive().max(200).optional(),
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
    const limit = filters.limit || 30;

    const result = await pool.query(
      `SELECT u.id, u.full_name, u.full_name_ky, u.full_name_en, u.email, u.phone, u.city, u.bio, u.avatar_url, u.skills,
              u.rating, u.total_reviews, u.is_pro, u.is_blocked, u.created_at, r.name AS role
       FROM users u
       JOIN roles r ON r.id = u.role_id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT ${limit}`,
      values,
    );

    const subscriptionsByUserId = await loadActiveSubscriptionsForUsers(result.rows.map((row) => row.id));

    return res.json(
      result.rows.map((row) =>
        mapAdminUser({
          ...row,
          ...(subscriptionsByUserId.get(row.id) || {}),
        }),
      ),
    );
  } catch (error) {
    return next(error);
  }
});

router.patch("/users/:userId", async (req, res, next) => {
  try {
    const { userId } = z.object({ userId: z.string().uuid() }).parse(req.params);
    const payload = updateAdminUserSchema.parse(req.body);
    const currentUser = await loadAdminUserById(userId);

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
      role: payload.role ?? currentUser.role,
    };

    if (!nextProfile.email && !nextProfile.phone) {
      return res.status(400).json({ message: "У пользователя должен остаться email или phone" });
    }

    if (nextProfile.email) {
      const emailExists = await pool.query(
        "SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id <> $2 LIMIT 1",
        [nextProfile.email, userId],
      );

      if (emailExists.rowCount) {
        return res.status(409).json({ message: "Пользователь с таким email уже существует" });
      }
    }

    if (nextProfile.phone) {
      const phoneExists = await pool.query(
        "SELECT id FROM users WHERE phone = $1 AND id <> $2 LIMIT 1",
        [nextProfile.phone, userId],
      );

      if (phoneExists.rowCount) {
        return res.status(409).json({ message: "Пользователь с таким phone уже существует" });
      }
    }

    const roleResult = await pool.query("SELECT id FROM roles WHERE name = $1 LIMIT 1", [nextProfile.role]);
    if (!roleResult.rowCount) {
      return res.status(400).json({ message: "Указанная роль не найдена" });
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
           role_id = $8,
           updated_at = NOW()
       WHERE id = $9`,
      [nextProfile.fullName, nextProfile.fullNameKy, nextProfile.fullNameEn, nextProfile.email, nextProfile.phone, nextProfile.city, nextProfile.bio, roleResult.rows[0].id, userId],
    );

    const updatedUser = await loadAdminUserById(userId);
    return res.json(mapAdminUser(updatedUser));
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({ message: "Пользователь с таким email или phone уже существует" });
    }

    return next(error);
  }
});

router.patch("/users/:userId/password", async (req, res, next) => {
  try {
    const { userId } = z.object({ userId: z.string().uuid() }).parse(req.params);
    const payload = updateAdminUserPasswordSchema.parse(req.body);
    const currentUser = await loadAdminUserById(userId);

    if (!currentUser) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    const nextPasswordHash = await bcrypt.hash(payload.newPassword, 10);
    await pool.query(
      `UPDATE users
       SET password_hash = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [nextPasswordHash, userId],
    );

    return res.json({ message: "Пароль пользователя обновлен" });
  } catch (error) {
    return next(error);
  }
});

router.patch("/users/:userId/block", async (req, res, next) => {
  try {
    const { userId } = z.object({ userId: z.string().uuid() }).parse(req.params);
    const payload = updateAdminUserBlockSchema.parse(req.body);
    const currentUser = await loadAdminUserById(userId);

    if (!currentUser) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    if (req.user?.sub === userId) {
      return res.status(400).json({ message: "Нельзя заблокировать собственный аккаунт" });
    }

    if (currentUser.role === "admin") {
      return res.status(400).json({ message: "Нельзя заблокировать администратора" });
    }

    await pool.query(
      `UPDATE users
       SET is_blocked = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [payload.blocked, userId],
    );

    const updatedUser = await loadAdminUserById(userId);
    return res.json(mapAdminUser(updatedUser));
  } catch (error) {
    return next(error);
  }
});

router.patch("/users/:userId/subscription", async (req, res, next) => {
  try {
    const { userId } = z.object({ userId: z.string().uuid() }).parse(req.params);
    const payload = updateAdminUserSubscriptionSchema.parse(req.body);
    const currentUser = await loadAdminUserById(userId);

    if (!currentUser) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    if (!["customer", "worker"].includes(currentUser.role)) {
      return res.status(400).json({ message: "Подписки можно назначать только заказчикам и исполнителям" });
    }

    if (payload.planId === null) {
      await pool.query(
        `UPDATE user_subscriptions
         SET status = 'cancelled'
         WHERE user_id = $1 AND status = 'active'`,
        [userId],
      );

      await syncUserProFlag(userId);
      const updatedUser = await loadAdminUserById(userId);
      return res.json(mapAdminUser(updatedUser));
    }

    const plan = await loadPlanById(payload.planId);

    if (!plan || !plan.is_active) {
      return res.status(404).json({ message: "Тариф не найден или отключен" });
    }

    if (plan.role_scope !== "all" && plan.role_scope !== currentUser.role) {
      return res.status(400).json({ message: "Выбранный тариф недоступен для этой роли" });
    }

    await pool.query(
      `UPDATE user_subscriptions
       SET status = 'cancelled'
       WHERE user_id = $1 AND status = 'active'`,
      [userId],
    );

    const endsAt = payload.endsAt ? new Date(payload.endsAt) : getSubscriptionEndDate(plan.billing_period);

    await pool.query(
      `INSERT INTO user_subscriptions (user_id, plan_id, status, amount_paid, currency, starts_at, ends_at)
       VALUES ($1, $2, 'active', $3, $4, NOW(), $5)`,
      [userId, plan.id, plan.price, plan.currency, endsAt.toISOString()],
    );

    await syncUserProFlag(userId);
    const updatedUser = await loadAdminUserById(userId);
    return res.json(mapAdminUser(updatedUser));
  } catch (error) {
    return next(error);
  }
});

router.get("/jobs", async (req, res, next) => {
  try {
    const filters = z
      .object({
        q: z.string().min(1).max(120).optional(),
        status: jobStatusSchema.optional(),
        city: z.string().min(2).max(120).optional(),
        limit: z.coerce.number().int().positive().max(200).optional(),
      })
      .parse(req.query);

    const values = [];
    const where = [];

    if (filters.q) {
      values.push(`%${filters.q.toLowerCase()}%`);
      where.push(`(
        LOWER(j.title) LIKE $${values.length}
        OR LOWER(j.description) LIKE $${values.length}
      )`);
    }

    if (filters.status) {
      values.push(filters.status);
      where.push(`j.status = $${values.length}`);
    }

    if (filters.city) {
      values.push(filters.city);
      where.push(`LOWER(j.city) = LOWER($${values.length})`);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const limit = filters.limit || 30;

    const result = await pool.query(
      `SELECT j.id, j.title, j.description, j.budget, j.city, j.due_date, j.status,
              j.escrow_status, j.is_urgent, j.created_at,
              c.id AS category_id, c.name AS category_name,
              cust.id AS customer_id, cust.full_name AS customer_name,
              worker.id AS worker_id, worker.full_name AS worker_name,
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
       ORDER BY j.created_at DESC
       LIMIT ${limit}`,
      values,
    );

    return res.json(result.rows.map(mapAdminJob));
  } catch (error) {
    return next(error);
  }
});

router.patch("/jobs/:jobId", async (req, res, next) => {
  try {
    const { jobId } = z.object({ jobId: z.string().uuid() }).parse(req.params);
    const payload = updateAdminJobSchema.parse(req.body);

    const currentJobResult = await pool.query(
      "SELECT id, worker_id, status, escrow_status FROM jobs WHERE id = $1",
      [jobId],
    );

    if (!currentJobResult.rowCount) {
      return res.status(404).json({ message: "Заказ не найден" });
    }

    const currentJob = currentJobResult.rows[0];
    const nextStatus = payload.status ?? currentJob.status;
    let nextEscrowStatus = payload.escrowStatus ?? currentJob.escrow_status;
    let nextWorkerId = currentJob.worker_id;

    if (nextStatus === "in_progress" && !currentJob.worker_id) {
      return res.status(400).json({ message: "Для статуса in_progress у заказа должен быть назначен исполнитель" });
    }

    if (payload.status === "open") {
      nextWorkerId = null;
      await pool.query(
        `UPDATE responses
         SET status = 'pending'
         WHERE job_id = $1 AND status IN ('accepted', 'rejected')`,
        [jobId],
      );
    }

    if (payload.status === "completed" && nextEscrowStatus === "reserved") {
      nextEscrowStatus = "released";
    }

    await pool.query(
      `UPDATE jobs
       SET status = $1,
           escrow_status = $2,
           worker_id = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [nextStatus, nextEscrowStatus, nextWorkerId, jobId],
    );

    const updatedJob = await loadAdminJobById(jobId);
    return res.json(mapAdminJob(updatedJob));
  } catch (error) {
    return next(error);
  }
});

router.delete("/jobs/:jobId", async (req, res, next) => {
  try {
    const { jobId } = z.object({ jobId: z.string().uuid() }).parse(req.params);

    const deleteResult = await pool.query("DELETE FROM jobs WHERE id = $1 RETURNING id", [jobId]);

    if (!deleteResult.rowCount) {
      return res.status(404).json({ message: "Заказ не найден" });
    }

    return res.json({ message: "Заказ удален", id: jobId });
  } catch (error) {
    return next(error);
  }
});

router.get("/plans", async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, slug, name, role_scope, billing_period, price, currency,
              description, features, is_pro, is_active, sort_order
       FROM subscription_plans
       ORDER BY sort_order ASC, id ASC`,
    );

    return res.json(result.rows.map(mapPlan));
  } catch (error) {
    return next(error);
  }
});

router.post("/plans", async (req, res, next) => {
  try {
    const payload = createPlanSchema.parse(req.body);
    const result = await pool.query(
      `INSERT INTO subscription_plans (
        slug, name, role_scope, billing_period, price, currency,
        description, features, is_pro, is_active, sort_order
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id`,
      [
        payload.slug,
        payload.name,
        payload.roleScope,
        payload.billingPeriod,
        payload.price,
        payload.currency || "KGS",
        payload.description,
        payload.features,
        payload.isPro ?? true,
        payload.isActive ?? true,
        payload.sortOrder ?? 100,
      ],
    );

    const plan = await loadPlanById(result.rows[0].id);
    return res.status(201).json(mapPlan(plan));
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({ message: "Тариф с таким slug уже существует" });
    }

    return next(error);
  }
});

router.patch("/plans/:planId", async (req, res, next) => {
  try {
    const { planId } = z.object({ planId: z.coerce.number().int().positive() }).parse(req.params);
    const payload = updatePlanSchema.parse(req.body);
    const currentPlan = await loadPlanById(planId);

    if (!currentPlan) {
      return res.status(404).json({ message: "Тариф не найден" });
    }

    await pool.query(
      `UPDATE subscription_plans
       SET slug = $1,
           name = $2,
           role_scope = $3,
           billing_period = $4,
           price = $5,
           currency = $6,
           description = $7,
           features = $8,
           is_pro = $9,
           is_active = $10,
           sort_order = $11
       WHERE id = $12`,
      [
        payload.slug ?? currentPlan.slug,
        payload.name ?? currentPlan.name,
        payload.roleScope ?? currentPlan.role_scope,
        payload.billingPeriod ?? currentPlan.billing_period,
        payload.price ?? currentPlan.price,
        payload.currency ?? currentPlan.currency,
        payload.description ?? currentPlan.description,
        payload.features ?? currentPlan.features,
        payload.isPro ?? currentPlan.is_pro,
        payload.isActive ?? currentPlan.is_active,
        payload.sortOrder ?? currentPlan.sort_order,
        planId,
      ],
    );

    const updatedPlan = await loadPlanById(planId);
    return res.json(mapPlan(updatedPlan));
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({ message: "Тариф с таким slug уже существует" });
    }

    return next(error);
  }
});

router.get("/subscriptions", async (req, res, next) => {
  try {
    const filters = z
      .object({
        status: subscriptionStatusSchema.optional(),
        userId: z.string().uuid().optional(),
        limit: z.coerce.number().int().positive().max(200).optional(),
      })
      .parse(req.query);

    const values = [];
    const where = [];

    if (filters.status) {
      values.push(filters.status);
      where.push(`us.status = $${values.length}`);
    }

    if (filters.userId) {
      values.push(filters.userId);
      where.push(`us.user_id = $${values.length}`);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const limit = filters.limit || 30;

    const result = await pool.query(
      `SELECT us.id, us.status, us.amount_paid, us.currency, us.starts_at, us.ends_at, us.created_at,
              u.id AS user_id, u.full_name AS user_full_name, r.name AS user_role,
              sp.id AS plan_id, sp.slug AS plan_slug, sp.name AS plan_name,
              sp.role_scope AS plan_role_scope, sp.billing_period AS plan_billing_period
       FROM user_subscriptions us
       JOIN users u ON u.id = us.user_id
       JOIN roles r ON r.id = u.role_id
       JOIN subscription_plans sp ON sp.id = us.plan_id
       ${whereClause}
       ORDER BY us.created_at DESC
       LIMIT ${limit}`,
      values,
    );

    return res.json(result.rows.map(mapAdminSubscription));
  } catch (error) {
    return next(error);
  }
});

router.patch("/subscriptions/:subscriptionId", async (req, res, next) => {
  try {
    const { subscriptionId } = z.object({ subscriptionId: z.string().uuid() }).parse(req.params);
    const payload = updateSubscriptionSchema.parse(req.body);
    const currentSubscription = await loadSubscriptionById(subscriptionId);

    if (!currentSubscription) {
      return res.status(404).json({ message: "Подписка не найдена" });
    }

    await pool.query(
      `UPDATE user_subscriptions
       SET status = $1,
           ends_at = $2
       WHERE id = $3`,
      [
        payload.status ?? currentSubscription.status,
        payload.endsAt ?? currentSubscription.ends_at,
        subscriptionId,
      ],
    );

    await syncUserProFlag(currentSubscription.user_id);

    const updatedSubscription = await loadSubscriptionById(subscriptionId);
    return res.json(mapAdminSubscription(updatedSubscription));
  } catch (error) {
    return next(error);
  }
});

router.get("/services", async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, slug, name, target_role, billing_type, price, currency,
              description, benefits, is_active, sort_order
       FROM platform_services
       ORDER BY sort_order ASC, id ASC`,
    );

    return res.json(result.rows.map(mapService));
  } catch (error) {
    return next(error);
  }
});

router.post("/services", async (req, res, next) => {
  try {
    const payload = createServiceSchema.parse(req.body);
    const result = await pool.query(
      `INSERT INTO platform_services (
        slug, name, target_role, billing_type, price, currency,
        description, benefits, is_active, sort_order
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        payload.slug,
        payload.name,
        payload.targetRole,
        payload.billingType,
        payload.price,
        payload.currency || "KGS",
        payload.description,
        payload.benefits,
        payload.isActive ?? true,
        payload.sortOrder ?? 100,
      ],
    );

    const service = await loadServiceById(result.rows[0].id);
    return res.status(201).json(mapService(service));
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({ message: "Услуга с таким slug уже существует" });
    }

    return next(error);
  }
});

router.patch("/services/:serviceId", async (req, res, next) => {
  try {
    const { serviceId } = z.object({ serviceId: z.coerce.number().int().positive() }).parse(req.params);
    const payload = updateServiceSchema.parse(req.body);
    const currentService = await loadServiceById(serviceId);

    if (!currentService) {
      return res.status(404).json({ message: "Услуга не найдена" });
    }

    await pool.query(
      `UPDATE platform_services
       SET slug = $1,
           name = $2,
           target_role = $3,
           billing_type = $4,
           price = $5,
           currency = $6,
           description = $7,
           benefits = $8,
           is_active = $9,
           sort_order = $10
       WHERE id = $11`,
      [
        payload.slug ?? currentService.slug,
        payload.name ?? currentService.name,
        payload.targetRole ?? currentService.target_role,
        payload.billingType ?? currentService.billing_type,
        payload.price ?? currentService.price,
        payload.currency ?? currentService.currency,
        payload.description ?? currentService.description,
        payload.benefits ?? currentService.benefits,
        payload.isActive ?? currentService.is_active,
        payload.sortOrder ?? currentService.sort_order,
        serviceId,
      ],
    );

    const updatedService = await loadServiceById(serviceId);
    return res.json(mapService(updatedService));
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({ message: "Услуга с таким slug уже существует" });
    }

    return next(error);
  }
});

router.get("/service-orders", async (req, res, next) => {
  try {
    const filters = z
      .object({
        status: serviceOrderStatusSchema.optional(),
        userId: z.string().uuid().optional(),
        limit: z.coerce.number().int().positive().max(200).optional(),
      })
      .parse(req.query);

    const values = [];
    const where = [];

    if (filters.status) {
      values.push(filters.status);
      where.push(`so.status = $${values.length}`);
    }

    if (filters.userId) {
      values.push(filters.userId);
      where.push(`so.user_id = $${values.length}`);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const limit = filters.limit || 30;

    const result = await pool.query(
      `SELECT so.id, so.status, so.price, so.currency, so.note, so.created_at,
              u.id AS user_id, u.full_name AS user_full_name, r.name AS user_role,
              ps.id AS service_id, ps.slug AS service_slug, ps.name AS service_name,
              ps.target_role AS service_target_role, ps.billing_type AS service_billing_type
       FROM service_orders so
       JOIN users u ON u.id = so.user_id
       JOIN roles r ON r.id = u.role_id
       JOIN platform_services ps ON ps.id = so.service_id
       ${whereClause}
       ORDER BY so.created_at DESC
       LIMIT ${limit}`,
      values,
    );

    return res.json(result.rows.map(mapAdminServiceOrder));
  } catch (error) {
    return next(error);
  }
});

router.patch("/service-orders/:orderId", async (req, res, next) => {
  try {
    const { orderId } = z.object({ orderId: z.string().uuid() }).parse(req.params);
    const payload = updateServiceOrderSchema.parse(req.body);
    const currentOrder = await loadServiceOrderById(orderId);

    if (!currentOrder) {
      return res.status(404).json({ message: "Заказ услуги не найден" });
    }

    await pool.query(
      `UPDATE service_orders
       SET status = $1
       WHERE id = $2`,
      [payload.status, orderId],
    );

    const updatedOrder = await loadServiceOrderById(orderId);
    return res.json(mapAdminServiceOrder(updatedOrder));
  } catch (error) {
    return next(error);
  }
});

module.exports = { adminRoutes: router };
