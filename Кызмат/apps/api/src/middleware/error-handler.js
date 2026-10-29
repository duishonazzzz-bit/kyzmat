function notFound(req, res) {
  res.status(404).json({ message: `Маршрут ${req.method} ${req.originalUrl} не найден` });
}

function isDatabaseUnavailable(error) {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "").toUpperCase();

  return (
    ["ECONNREFUSED", "ECONNRESET", "ENOTFOUND", "ETIMEDOUT", "57P01", "53300"].includes(code) ||
    message.includes("connection refused") ||
    message.includes("database") && message.includes("does not exist")
  );
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err?.name === "ZodError") {
    return res.status(400).json({ message: "Ошибка валидации", errors: err.issues });
  }

  if (isDatabaseUnavailable(err)) {
    return res.status(503).json({
      message: "База данных временно недоступна. Попробуйте снова через несколько минут.",
    });
  }

  console.error(err);
  return res.status(err.statusCode || 500).json({
    message: err.publicMessage || "Внутренняя ошибка сервера",
  });
}

module.exports = { notFound, errorHandler };
