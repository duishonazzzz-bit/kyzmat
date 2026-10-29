const { Router } = require("express");
const { z } = require("zod");
const { pool } = require("../db/pool");
const { requireAuth } = require("../middleware/auth");

const router = Router();

const activateSubscriptionSchema = z.object({
  planSlug: z.string().min(2).max(80),
});

const orderServiceSchema = z.object({
  serviceSlug: z.string().min(2).max(80),
  note: z.string().max(500).optional(),
});

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
  };
}

function mapSubscription(row) {
  if (!row) return null;

  return {
    id: row.id,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    amountPaid: Number(row.amount_paid || 0),
    currency: row.currency,
    plan: {
      slug: row.plan_slug,
      name: row.plan_name,
      roleScope: row.plan_role_scope,
      billingPeriod: row.plan_billing_period,
      description: row.plan_description,
      features: row.plan_features || [],
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
  };
}

function mapServiceOrder(row) {
  return {
    id: row.id,
    status: row.status,
    price: Number(row.price || 0),
    currency: row.currency,
    note: row.note,
    createdAt: row.created_at,
    service: {
      slug: row.service_slug,
      name: row.service_name,
      targetRole: row.service_target_role,
      billingType: row.service_billing_type,
    },
  };
}

function getAudienceRole(role) {
  if (role === "customer" || role === "worker") {
    return role;
  }

  return "all";
}

async function syncActiveSubscription(userId) {
  await pool.query(
    `UPDATE user_subscriptions
     SET status = 'expired'
     WHERE user_id = $1 AND status = 'active' AND ends_at < NOW()`,
    [userId],
  );

  const activeResult = await pool.query(
    `SELECT us.id, us.status, us.starts_at, us.ends_at, us.amount_paid, us.currency,
            sp.slug AS plan_slug, sp.name AS plan_name, sp.role_scope AS plan_role_scope,
            sp.billing_period AS plan_billing_period, sp.description AS plan_description, sp.features AS plan_features
     FROM user_subscriptions us
     JOIN subscription_plans sp ON sp.id = us.plan_id
     WHERE us.user_id = $1 AND us.status = 'active' AND us.ends_at >= NOW()
     ORDER BY us.ends_at DESC, us.created_at DESC
     LIMIT 1`,
    [userId],
  );

  const activeSubscription = activeResult.rows[0] || null;

  await pool.query(
    `UPDATE users
     SET is_pro = $1, updated_at = NOW()
     WHERE id = $2`,
    [Boolean(activeSubscription), userId],
  );

  return mapSubscription(activeSubscription);
}

async function loadAvailablePlans(role) {
  if (role === "customer" || role === "worker") {
    const result = await pool.query(
      `SELECT id, slug, name, role_scope, billing_period, price, currency, description, features, is_pro
       FROM subscription_plans
       WHERE is_active = TRUE AND (role_scope = $1 OR role_scope = 'all')
       ORDER BY sort_order ASC, price ASC`,
      [role],
    );

    return result.rows.map(mapPlan);
  }

  const result = await pool.query(
    `SELECT id, slug, name, role_scope, billing_period, price, currency, description, features, is_pro
     FROM subscription_plans
     WHERE is_active = TRUE AND role_scope = 'all'
     ORDER BY sort_order ASC, price ASC`,
  );

  return result.rows.map(mapPlan);
}

async function loadAvailableServices(role) {
  if (role === "customer" || role === "worker") {
    const result = await pool.query(
      `SELECT id, slug, name, target_role, billing_type, price, currency, description, benefits
       FROM platform_services
       WHERE is_active = TRUE AND (target_role = $1 OR target_role = 'all')
       ORDER BY sort_order ASC, price ASC`,
      [role],
    );

    return result.rows.map(mapService);
  }

  const result = await pool.query(
    `SELECT id, slug, name, target_role, billing_type, price, currency, description, benefits
     FROM platform_services
     WHERE is_active = TRUE AND target_role = 'all'
     ORDER BY sort_order ASC, price ASC`,
  );

  return result.rows.map(mapService);
}

async function loadServiceOrders(userId) {
  const result = await pool.query(
    `SELECT so.id, so.status, so.price, so.currency, so.note, so.created_at,
            ps.slug AS service_slug, ps.name AS service_name, ps.target_role AS service_target_role,
            ps.billing_type AS service_billing_type
     FROM service_orders so
     JOIN platform_services ps ON ps.id = so.service_id
     WHERE so.user_id = $1
     ORDER BY so.created_at DESC
     LIMIT 20`,
    [userId],
  );

  return result.rows.map(mapServiceOrder);
}

async function findPlanForRole(planSlug, role) {
  const audienceRole = getAudienceRole(role);

  if (audienceRole === "all") {
    const result = await pool.query(
      `SELECT id, slug, name, role_scope, billing_period, price, currency, description, features, is_pro
       FROM subscription_plans
       WHERE slug = $1 AND is_active = TRUE AND role_scope = 'all'
       LIMIT 1`,
      [planSlug],
    );

    return result.rows[0] || null;
  }

  const result = await pool.query(
    `SELECT id, slug, name, role_scope, billing_period, price, currency, description, features, is_pro
     FROM subscription_plans
     WHERE slug = $1 AND is_active = TRUE AND (role_scope = $2 OR role_scope = 'all')
     LIMIT 1`,
    [planSlug, audienceRole],
  );

  return result.rows[0] || null;
}

async function findServiceForRole(serviceSlug, role) {
  const audienceRole = getAudienceRole(role);

  if (audienceRole === "all") {
    const result = await pool.query(
      `SELECT id, slug, name, target_role, billing_type, price, currency, description, benefits
       FROM platform_services
       WHERE slug = $1 AND is_active = TRUE AND target_role = 'all'
       LIMIT 1`,
      [serviceSlug],
    );

    return result.rows[0] || null;
  }

  const result = await pool.query(
    `SELECT id, slug, name, target_role, billing_type, price, currency, description, benefits
     FROM platform_services
     WHERE slug = $1 AND is_active = TRUE AND (target_role = $2 OR target_role = 'all')
     LIMIT 1`,
    [serviceSlug, audienceRole],
  );

  return result.rows[0] || null;
}

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const currentSubscription = await syncActiveSubscription(req.user.sub);
    const [plans, services, serviceOrders] = await Promise.all([
      loadAvailablePlans(req.user.role),
      loadAvailableServices(req.user.role),
      loadServiceOrders(req.user.sub),
    ]);

    return res.json({
      audienceRole: getAudienceRole(req.user.role),
      canBuySubscriptions: ["customer", "worker"].includes(req.user.role),
      currentSubscription,
      plans,
      services,
      serviceOrders,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/activate", requireAuth, async (req, res, next) => {
  try {
    if (!["customer", "worker"].includes(req.user.role)) {
      return res.status(403).json({ message: "Подписки доступны только заказчикам и исполнителям" });
    }

    const payload = activateSubscriptionSchema.parse(req.body);
    const plan = await findPlanForRole(payload.planSlug, req.user.role);

    if (!plan) {
      return res.status(404).json({ message: "Тариф не найден для вашей роли" });
    }

    await pool.query(
      `UPDATE user_subscriptions
       SET status = 'cancelled'
       WHERE user_id = $1 AND status = 'active'`,
      [req.user.sub],
    );

    const endsAt = getSubscriptionEndDate(plan.billing_period);

    await pool.query(
      `INSERT INTO user_subscriptions (user_id, plan_id, status, amount_paid, currency, starts_at, ends_at)
       VALUES ($1, $2, 'active', $3, $4, NOW(), $5)`,
      [req.user.sub, plan.id, plan.price, plan.currency, endsAt.toISOString()],
    );

    const subscription = await syncActiveSubscription(req.user.sub);

    return res.status(201).json({
      message: `Подписка ${plan.name} успешно активирована`,
      subscription,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/services/order", requireAuth, async (req, res, next) => {
  try {
    const payload = orderServiceSchema.parse(req.body);
    const service = await findServiceForRole(payload.serviceSlug, req.user.role);

    if (!service) {
      return res.status(404).json({ message: "Услуга не найдена для вашей роли" });
    }

    const currentSubscription = await syncActiveSubscription(req.user.sub);

    if (service.billing_type === "subscription_included" && !currentSubscription) {
      return res.status(400).json({ message: "Для этой услуги нужна активная подписка" });
    }

    const price = service.billing_type === "subscription_included" ? 0 : Number(service.price || 0);

    const result = await pool.query(
      `INSERT INTO service_orders (service_id, user_id, status, price, currency, note)
       VALUES ($1, $2, 'ordered', $3, $4, $5)
       RETURNING id, status, price, currency, note, created_at`,
      [service.id, req.user.sub, price, service.currency, payload.note || null],
    );

    return res.status(201).json({
      message:
        price > 0
          ? `Услуга ${service.name} заказана`
          : `Услуга ${service.name} активирована в рамках подписки`,
      order: {
        ...mapServiceOrder({
          ...result.rows[0],
          service_slug: service.slug,
          service_name: service.name,
          service_target_role: service.target_role,
          service_billing_type: service.billing_type,
        }),
      },
      currentSubscription,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = { subscriptionsRoutes: router };
