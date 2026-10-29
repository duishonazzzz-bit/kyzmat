const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

function extractToken(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice("Bearer ".length);
}

function requireAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: "Требуется авторизация" });
  }

  try {
    req.user = jwt.verify(token, env.jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ message: "Токен недействителен" });
  }
}

function optionalAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    req.user = jwt.verify(token, env.jwtSecret);
    return next();
  } catch {
    req.user = null;
    return next();
  }
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Требуется авторизация" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Недостаточно прав" });
    }

    return next();
  };
}

module.exports = { requireAuth, optionalAuth, requireRoles };
