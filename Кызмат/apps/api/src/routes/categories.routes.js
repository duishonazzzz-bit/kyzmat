const { Router } = require("express");
const { pool } = require("../db/pool");

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT id, name FROM categories ORDER BY name");
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

module.exports = { categoriesRoutes: router };
