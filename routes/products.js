const express = require("express");
const { pool } = require("../db");

console.log("✅ products routes file loaded");

const router = express.Router();

// TEST ROUTE
router.get("/test", (req, res) => {
  res.json({ ok: true, route: "products test working" });
});

// GET /api/products
router.get("/products", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT product_id, name, category, price, stock, description FROM Product"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch products",
      details: err.message,
    });
  }
});

// GET /api/search?q=keyword
// DBMS: SQL LIKE on name, category, description
router.get("/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json([]);

    const like = `%${q}%`;
    const [rows] = await pool.query(
      `SELECT product_id, name, category, price, stock, description
       FROM Product
       WHERE name LIKE ? OR category LIKE ? OR (description IS NOT NULL AND description LIKE ?)
       ORDER BY name`,
      [like, like, like]
    );
    console.log(`Search q="${q}" -> ${rows.length} results`);
    res.json(rows);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed", details: err.message });
  }
});

module.exports = router;
