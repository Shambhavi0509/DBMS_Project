/**
 * routes/reports.js
 *
 * APIs:
 * - GET /reports/daily-sales  -> uses VIEW daily_sales_report
 * - GET /reports/top-products -> aggregate query (SUM + GROUP BY)
 *
 * DBMS note (for viva):
 * - VIEW simplifies reporting queries by saving a reusable SELECT.
 * - Aggregate queries show DBMS power for analytics (SUM, GROUP BY).
 */

const express = require("express");
const { pool } = require("../db");

const router = express.Router();

router.get("/reports/daily-sales", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT sale_date, total_sales_amount FROM daily_sales_report");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch daily sales report", details: err.message });
  }
});

router.get("/reports/top-products", async (req, res) => {
  try {
    // Aggregate query: SUM(quantity) GROUP BY product
    const [rows] = await pool.query(`
      SELECT
        p.product_id,
        p.name,
        p.category,
        SUM(si.quantity) AS total_quantity_sold,
        SUM(si.quantity * si.price) AS total_revenue
      FROM Sale_Item si
      INNER JOIN Product p ON p.product_id = si.product_id
      GROUP BY p.product_id, p.name, p.category
      ORDER BY total_quantity_sold DESC
      LIMIT 10
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch top products report", details: err.message });
  }
});

module.exports = router;


