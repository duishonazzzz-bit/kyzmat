const { Router } = require("express");
const { z } = require("zod");
const { pool } = require("../db/pool");
const { requireAuth } = require("../middleware/auth");

const router = Router();

const optionalTrimmedString = (schema) =>
  z.preprocess((value) => {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    }

    return value;
  }, schema.optional());

const messageQuerySchema = z.object({
  jobId: z.string().uuid().optional(),
  withUserId: z.string().uuid().optional(),
});

const createMessageSchema = z
  .object({
    receiverId: z.string().uuid(),
    jobId: z.string().uuid().optional(),
    body: optionalTrimmedString(z.string().min(1).max(2000)),
    fileUrl: optionalTrimmedString(z.string().url()),
  })
  .refine((value) => Boolean(value.body || value.fileUrl), {
    message: "Укажите текст сообщения или ссылку на файл",
    path: ["body"],
  });

const updateMessageSchema = z
  .object({
    body: optionalTrimmedString(z.string().min(1).max(2000)),
    fileUrl: optionalTrimmedString(z.string().url()),
  })
  .refine((value) => Boolean(value.body || value.fileUrl), {
    message: "Укажите текст сообщения или ссылку на файл",
    path: ["body"],
  });

function previewMessage(row) {
  if (row.is_deleted) {
    return "Сообщение удалено";
  }

  if (row.body) {
    return row.body.length > 90 ? `${row.body.slice(0, 87)}...` : row.body;
  }

  if (row.file_url) {
    return "Файл";
  }

  return "Сообщение";
}

function mapMessageRow(row) {
  return {
    id: row.id,
    jobId: row.job_id,
    jobTitle: row.job_title,
    jobStatus: row.job_status,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderNameKy: row.sender_name_ky || null,
    senderNameEn: row.sender_name_en || null,
    senderRole: row.sender_role,
    senderCity: row.sender_city,
    receiverId: row.receiver_id,
    receiverName: row.receiver_name,
    receiverNameKy: row.receiver_name_ky || null,
    receiverNameEn: row.receiver_name_en || null,
    receiverRole: row.receiver_role,
    receiverCity: row.receiver_city,
    body: row.body,
    fileUrl: row.file_url,
    isRead: row.is_read,
    isDeleted: row.is_deleted,
    editedAt: row.edited_at,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
  };
}

async function loadMessageRows(userId, filters = {}, direction = "ASC") {
  const values = [userId];
  const where = ["(m.sender_id = $1 OR m.receiver_id = $1)"];

  if (filters.jobId) {
    values.push(filters.jobId);
    where.push(`m.job_id = $${values.length}`);
  }

  if (filters.withUserId) {
    values.push(filters.withUserId);
    where.push(`(m.sender_id = $${values.length} OR m.receiver_id = $${values.length})`);
  }

  const result = await pool.query(
    `SELECT m.id, m.job_id, m.sender_id, m.receiver_id, m.body, m.file_url, m.is_read, m.is_deleted, m.edited_at, m.deleted_at, m.created_at,
            s.full_name AS sender_name,
            s.full_name_ky AS sender_name_ky,
            s.full_name_en AS sender_name_en,
            s.city AS sender_city,
            sr.name AS sender_role,
            r.full_name AS receiver_name,
            r.full_name_ky AS receiver_name_ky,
            r.full_name_en AS receiver_name_en,
            r.city AS receiver_city,
            rr.name AS receiver_role,
            j.title AS job_title,
            j.status AS job_status
     FROM messages m
     JOIN users s ON s.id = m.sender_id
     JOIN roles sr ON sr.id = s.role_id
     JOIN users r ON r.id = m.receiver_id
     JOIN roles rr ON rr.id = r.role_id
     LEFT JOIN jobs j ON j.id = m.job_id
     WHERE ${where.join(" AND ")}
     ORDER BY m.created_at ${direction}, m.id ${direction}`,
    values,
  );

  return result.rows;
}

async function markMessagesAsRead(userId, filters = {}) {
  const values = [userId];
  const where = ["receiver_id = $1", "is_read = FALSE"];

  if (filters.jobId) {
    values.push(filters.jobId);
    where.push(`job_id = $${values.length}`);
  }

  if (filters.withUserId) {
    values.push(filters.withUserId);
    where.push(`sender_id = $${values.length}`);
  }

  await pool.query(
    `UPDATE messages
     SET is_read = TRUE
     WHERE ${where.join(" AND ")}`,
    values,
  );
}

function buildConversationList(rows, userId) {
  const conversations = new Map();

  rows.forEach((row) => {
    const isMine = row.sender_id === userId;
    const contactId = isMine ? row.receiver_id : row.sender_id;
    const contactName = isMine ? row.receiver_name : row.sender_name;
    const contactRole = isMine ? row.receiver_role : row.sender_role;
    const contactCity = isMine ? row.receiver_city : row.sender_city;
    const key = `${contactId}:${row.job_id || "general"}`;
    const unreadIncrement = !isMine && !row.is_read ? 1 : 0;

    if (!conversations.has(key)) {
      conversations.set(key, {
        key,
        contactId,
        contactName,
        contactNameKy: isMine ? row.receiver_name_ky : row.sender_name_ky,
        contactNameEn: isMine ? row.receiver_name_en : row.sender_name_en,
        contactRole,
        contactCity,
        jobId: row.job_id,
        jobTitle: row.job_title,
        jobStatus: row.job_status,
        lastMessagePreview: previewMessage(row),
        lastMessageAt: row.created_at,
        lastMessageIsMine: isMine,
        unreadCount: unreadIncrement,
      });
      return;
    }

    const current = conversations.get(key);
    current.unreadCount += unreadIncrement;
  });

  return Array.from(conversations.values()).sort(
    (left, right) => new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime(),
  );
}

function upsertContact(contactsMap, row, source) {
  if (!row?.contact_id) {
    return;
  }

  if (!contactsMap.has(row.contact_id)) {
      contactsMap.set(row.contact_id, {
        id: row.contact_id,
        fullName: row.contact_name,
        fullNameKy: row.contact_name_ky || null,
        fullNameEn: row.contact_name_en || null,
        role: row.contact_role,
      city: row.contact_city,
      hasConversation: source === "messages",
      lastInteractionAt: row.activity_at || null,
      relatedJobs: [],
      sourceTypes: new Set([source]),
    });
  }

  const contact = contactsMap.get(row.contact_id);
  contact.fullName = contact.fullName || row.contact_name;
  contact.fullNameKy = contact.fullNameKy || row.contact_name_ky || null;
  contact.fullNameEn = contact.fullNameEn || row.contact_name_en || null;
  contact.role = contact.role || row.contact_role;
  contact.city = contact.city || row.contact_city;
  contact.hasConversation = contact.hasConversation || source === "messages";
  contact.sourceTypes.add(source);

  if (row.activity_at && (!contact.lastInteractionAt || row.activity_at > contact.lastInteractionAt)) {
    contact.lastInteractionAt = row.activity_at;
  }

  if (row.job_id && !contact.relatedJobs.some((job) => job.id === row.job_id)) {
    contact.relatedJobs.push({
      id: row.job_id,
      title: row.job_title,
      status: row.job_status,
    });
  }
}

async function loadRelatedContacts(userId) {
  const contacts = new Map();

  const [
    messageRows,
    customerAssignedRows,
    workerAssignedRows,
    customerResponseRows,
    workerResponseRows,
  ] = await Promise.all([
    pool.query(
      `SELECT CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END AS contact_id,
              CASE WHEN m.sender_id = $1 THEN r.full_name ELSE s.full_name END AS contact_name,
              CASE WHEN m.sender_id = $1 THEN r.full_name_ky ELSE s.full_name_ky END AS contact_name_ky,
              CASE WHEN m.sender_id = $1 THEN r.full_name_en ELSE s.full_name_en END AS contact_name_en,
              CASE WHEN m.sender_id = $1 THEN rr.name ELSE sr.name END AS contact_role,
              CASE WHEN m.sender_id = $1 THEN r.city ELSE s.city END AS contact_city,
              m.job_id,
              j.title AS job_title,
              j.status AS job_status,
              m.created_at AS activity_at
       FROM messages m
       JOIN users s ON s.id = m.sender_id
       JOIN roles sr ON sr.id = s.role_id
       JOIN users r ON r.id = m.receiver_id
       JOIN roles rr ON rr.id = r.role_id
       LEFT JOIN jobs j ON j.id = m.job_id
       WHERE m.sender_id = $1 OR m.receiver_id = $1
       ORDER BY m.created_at DESC`,
      [userId],
    ),
    pool.query(
      `SELECT u.id AS contact_id, u.full_name AS contact_name, u.full_name_ky AS contact_name_ky, u.full_name_en AS contact_name_en, role.name AS contact_role, u.city AS contact_city,
              j.id AS job_id, j.title AS job_title, j.status AS job_status, j.updated_at AS activity_at
       FROM jobs j
       JOIN users u ON u.id = j.worker_id
       JOIN roles role ON role.id = u.role_id
       WHERE j.customer_id = $1 AND j.worker_id IS NOT NULL
       ORDER BY j.updated_at DESC`,
      [userId],
    ),
    pool.query(
      `SELECT u.id AS contact_id, u.full_name AS contact_name, u.full_name_ky AS contact_name_ky, u.full_name_en AS contact_name_en, role.name AS contact_role, u.city AS contact_city,
              j.id AS job_id, j.title AS job_title, j.status AS job_status, j.updated_at AS activity_at
       FROM jobs j
       JOIN users u ON u.id = j.customer_id
       JOIN roles role ON role.id = u.role_id
       WHERE j.worker_id = $1
       ORDER BY j.updated_at DESC`,
      [userId],
    ),
    pool.query(
      `SELECT u.id AS contact_id, u.full_name AS contact_name, u.full_name_ky AS contact_name_ky, u.full_name_en AS contact_name_en, role.name AS contact_role, u.city AS contact_city,
              j.id AS job_id, j.title AS job_title, j.status AS job_status, resp.created_at AS activity_at
       FROM jobs j
       JOIN responses resp ON resp.job_id = j.id
       JOIN users u ON u.id = resp.worker_id
       JOIN roles role ON role.id = u.role_id
       WHERE j.customer_id = $1
       ORDER BY resp.created_at DESC`,
      [userId],
    ),
    pool.query(
      `SELECT u.id AS contact_id, u.full_name AS contact_name, u.full_name_ky AS contact_name_ky, u.full_name_en AS contact_name_en, role.name AS contact_role, u.city AS contact_city,
              j.id AS job_id, j.title AS job_title, j.status AS job_status, resp.created_at AS activity_at
       FROM responses resp
       JOIN jobs j ON j.id = resp.job_id
       JOIN users u ON u.id = j.customer_id
       JOIN roles role ON role.id = u.role_id
       WHERE resp.worker_id = $1
       ORDER BY resp.created_at DESC`,
      [userId],
    ),
  ]);

  messageRows.rows.forEach((row) => upsertContact(contacts, row, "messages"));
  customerAssignedRows.rows.forEach((row) => upsertContact(contacts, row, "assigned_jobs"));
  workerAssignedRows.rows.forEach((row) => upsertContact(contacts, row, "assigned_jobs"));
  customerResponseRows.rows.forEach((row) => upsertContact(contacts, row, "responses"));
  workerResponseRows.rows.forEach((row) => upsertContact(contacts, row, "responses"));

  return Array.from(contacts.values())
    .map((contact) => ({
      ...contact,
      sourceTypes: Array.from(contact.sourceTypes),
      relatedJobs: contact.relatedJobs.sort((left, right) => left.title.localeCompare(right.title, "ru")),
    }))
    .sort((left, right) => {
      if (left.lastInteractionAt && right.lastInteractionAt) {
        return new Date(right.lastInteractionAt).getTime() - new Date(left.lastInteractionAt).getTime();
      }

      if (left.lastInteractionAt) return -1;
      if (right.lastInteractionAt) return 1;
      return left.fullName.localeCompare(right.fullName, "ru");
    });
}

async function ensureJobMessageAccess(userId, userRole, receiverId, jobId) {
  const jobResult = await pool.query(
    `SELECT id, title, customer_id, worker_id, status
     FROM jobs
     WHERE id = $1
     LIMIT 1`,
    [jobId],
  );

  if (!jobResult.rowCount) {
    return { status: 404, message: "Заказ не найден" };
  }

  if (userRole === "admin") {
    return null;
  }

  const job = jobResult.rows[0];

  if (userId === job.customer_id) {
    if (receiverId === job.worker_id) {
      return null;
    }

    const responseResult = await pool.query(
      `SELECT id
       FROM responses
       WHERE job_id = $1 AND worker_id = $2
       LIMIT 1`,
      [jobId, receiverId],
    );

    if (responseResult.rowCount) {
      return null;
    }

    return { status: 403, message: "Можно писать по заказу только исполнителю, связанному с этой задачей" };
  }

  if (receiverId !== job.customer_id) {
    return { status: 403, message: "Исполнитель может писать по заказу только заказчику" };
  }

  if (userId === job.worker_id) {
    return null;
  }

  const ownResponseResult = await pool.query(
    `SELECT id
     FROM responses
     WHERE job_id = $1 AND worker_id = $2
     LIMIT 1`,
    [jobId, userId],
  );

  if (ownResponseResult.rowCount) {
    return null;
  }

  return { status: 403, message: "Вы не связаны с этим заказом и не можете открыть чат по нему" };
}

router.get("/conversations", requireAuth, async (req, res, next) => {
  try {
    const rows = await loadMessageRows(req.user.sub, {}, "DESC");
    return res.json(buildConversationList(rows, req.user.sub));
  } catch (error) {
    return next(error);
  }
});

router.get("/contacts", requireAuth, async (req, res, next) => {
  try {
    const contacts = await loadRelatedContacts(req.user.sub);
    return res.json(contacts);
  } catch (error) {
    return next(error);
  }
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const query = messageQuerySchema.parse(req.query);
    const rows = await loadMessageRows(req.user.sub, query, "ASC");

    if (query.jobId || query.withUserId) {
      await markMessagesAsRead(req.user.sub, query);
    }

    return res.json(rows.map(mapMessageRow));
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const payload = createMessageSchema.parse(req.body);

    if (payload.receiverId === req.user.sub) {
      return res.status(400).json({ message: "Нельзя отправить сообщение самому себе" });
    }

    const receiverResult = await pool.query(
      `SELECT id
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [payload.receiverId],
    );

    if (!receiverResult.rowCount) {
      return res.status(404).json({ message: "Собеседник не найден" });
    }

    if (payload.jobId) {
      const accessError = await ensureJobMessageAccess(
        req.user.sub,
        req.user.role,
        payload.receiverId,
        payload.jobId,
      );

      if (accessError) {
        return res.status(accessError.status).json({ message: accessError.message });
      }
    }

    const result = await pool.query(
      `INSERT INTO messages (job_id, sender_id, receiver_id, body, file_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [payload.jobId || null, req.user.sub, payload.receiverId, payload.body || null, payload.fileUrl || null],
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.patch("/:messageId", requireAuth, async (req, res, next) => {
  try {
    const { messageId } = z.object({ messageId: z.string().uuid() }).parse(req.params);
    const payload = updateMessageSchema.parse(req.body);

    const messageResult = await pool.query(
      `SELECT id, sender_id, is_deleted
       FROM messages
       WHERE id = $1
       LIMIT 1`,
      [messageId],
    );

    if (!messageResult.rowCount) {
      return res.status(404).json({ message: "Сообщение не найдено" });
    }

    const message = messageResult.rows[0];

    if (message.sender_id !== req.user.sub) {
      return res.status(403).json({ message: "Можно редактировать только свои сообщения" });
    }

    if (message.is_deleted) {
      return res.status(400).json({ message: "Удалённое сообщение нельзя редактировать" });
    }

    const result = await pool.query(
      `UPDATE messages
       SET body = $1,
           file_url = $2,
           edited_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [payload.body || null, payload.fileUrl || null, messageId],
    );

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:messageId", requireAuth, async (req, res, next) => {
  try {
    const { messageId } = z.object({ messageId: z.string().uuid() }).parse(req.params);

    const messageResult = await pool.query(
      `SELECT id, sender_id, is_deleted
       FROM messages
       WHERE id = $1
       LIMIT 1`,
      [messageId],
    );

    if (!messageResult.rowCount) {
      return res.status(404).json({ message: "Сообщение не найдено" });
    }

    const message = messageResult.rows[0];

    if (message.sender_id !== req.user.sub) {
      return res.status(403).json({ message: "Можно удалить только свои сообщения" });
    }

    if (message.is_deleted) {
      return res.json({ id: messageId, isDeleted: true });
    }

    await pool.query(
      `UPDATE messages
       SET body = $1,
           file_url = NULL,
           is_deleted = TRUE,
           deleted_at = NOW(),
           edited_at = NULL
       WHERE id = $2`,
      ["Сообщение удалено", messageId],
    );

    return res.json({ id: messageId, isDeleted: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = { messagesRoutes: router };
