/**
 * routes/salesperson.js
 *
 * Sales Person Dashboard APIs (No Auth - Role-based UI only)
 *
 * APIs:
 * - GET /salesperson/customers         -> All customers with purchase stats
 * - GET /salesperson/top-customers     -> Top customers by spending
 * - GET /salesperson/customer-report   -> Detailed customer purchase report
 * - GET /salesperson/daily-sales       -> Daily sales summary
 * - GET /salesperson/summary           -> Overall sales summary
 *
 * DBMS Concepts (for viva):
 * - Aggregate functions: SUM(), COUNT(), AVG()
 * - GROUP BY with multiple columns
 * - LEFT JOIN vs INNER JOIN (to include customers with no purchases)
 * - Subqueries for complex calculations
 * - ORDER BY with aggregate results
 */

const express = require("express");
const { pool } = require("../db");

const router = express.Router();

/**
 * POST /salesperson/signup
 * Body: { name, email } — no password (academic project)
 */
router.post("/salesperson/signup", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!name || name.length < 2) return res.status(400).json({ error: "Name required (min 2 chars)" });
    if (!email || !email.includes("@")) return res.status(400).json({ error: "Valid email required" });

    const [existing] = await pool.query("SELECT salesperson_id FROM Salesperson WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(400).json({ error: "Email already registered" });

    const [result] = await pool.query(
      "INSERT INTO Salesperson (name, email) VALUES (?, ?)",
      [name, email]
    );
    const salesperson_id = result.insertId;
    const [rows] = await pool.query(
      "SELECT salesperson_id, name, email, created_at FROM Salesperson WHERE salesperson_id = ?",
      [salesperson_id]
    );
    console.log(`Salesperson signup: salesperson_id=${salesperson_id}`);
    res.status(201).json({ message: "Registration successful", salesperson: rows[0] });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "Email already registered" });
    res.status(500).json({ error: "Signup failed", details: err.message });
  }
});

/**
 * POST /salesperson/login
 * Body: { email } OR { salesperson_id } — identity lookup only, no password
 */
router.post("/salesperson/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const salesperson_id = req.body.salesperson_id != null ? Number(req.body.salesperson_id) : null;

    if (!email && (!salesperson_id || !Number.isInteger(salesperson_id) || salesperson_id <= 0)) {
      return res.status(400).json({ error: "Email or Employee ID (salesperson_id) required" });
    }

    let rows;
    if (email && salesperson_id) {
      [rows] = await pool.query(
        "SELECT salesperson_id, name, email, created_at FROM Salesperson WHERE email = ? OR salesperson_id = ? LIMIT 1",
        [email, salesperson_id]
      );
    } else if (email) {
      [rows] = await pool.query(
        "SELECT salesperson_id, name, email, created_at FROM Salesperson WHERE email = ? LIMIT 1",
        [email]
      );
    } else {
      [rows] = await pool.query(
        "SELECT salesperson_id, name, email, created_at FROM Salesperson WHERE salesperson_id = ? LIMIT 1",
        [salesperson_id]
      );
    }

    if (rows.length === 0) return res.status(401).json({ error: "Salesperson not found" });

    const sp = rows[0];
    console.log(`Salesperson login: salesperson_id=${sp.salesperson_id}`);
    res.json({ message: "Login successful", salesperson: sp });
  } catch (err) {
    res.status(500).json({ error: "Login failed", details: err.message });
  }
});

/**
 * GET /salesperson/customers
 *
 * List all customers with their purchase statistics
 *
 * DBMS Concepts:
 * - LEFT JOIN: Include customers even if they have no purchases
 * - COUNT(): Count number of orders per customer
 * - SUM(): Calculate total spent per customer
 * - COALESCE(): Handle NULL values (customers with no purchases)
 */
router.get("/salesperson/customers", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.customer_id,
        c.name,
        c.phone,
        c.email,
        COUNT(DISTINCT s.sale_id) AS total_orders,
        COALESCE(SUM(si.quantity), 0) AS total_items_purchased,
        COALESCE(SUM(s.total_amount), 0) AS total_amount_spent,
        MAX(s.sale_date) AS last_purchase_date
      FROM Customer c
      LEFT JOIN Sale s ON s.customer_id = c.customer_id
      LEFT JOIN Sale_Item si ON si.sale_id = s.sale_id
      GROUP BY c.customer_id, c.name, c.phone, c.email
      ORDER BY total_amount_spent DESC, c.name ASC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customers", details: err.message });
  }
});

/**
 * GET /salesperson/top-customers
 *
 * Top 10 customers by total amount spent
 *
 * DBMS Concepts:
 * - INNER JOIN: Only include customers with purchases
 * - HAVING: Filter after GROUP BY (optional, using WHERE here)
 * - LIMIT: Restrict result count
 */
router.get("/salesperson/top-customers", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.customer_id,
        c.name,
        c.phone,
        c.email,
        COUNT(DISTINCT s.sale_id) AS total_orders,
        SUM(si.quantity) AS total_items_purchased,
        SUM(s.total_amount) AS total_amount_spent,
        AVG(s.total_amount) AS avg_order_value
      FROM Customer c
      INNER JOIN Sale s ON s.customer_id = c.customer_id
      INNER JOIN Sale_Item si ON si.sale_id = s.sale_id
      GROUP BY c.customer_id, c.name, c.phone, c.email
      ORDER BY total_amount_spent DESC
      LIMIT 10
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch top customers", details: err.message });
  }
});

/**
 * GET /salesperson/customer-report
 *
 * Detailed customer purchase report (for viva - shows complex JOIN)
 *
 * Returns:
 * - customer_id, customer_name
 * - total_orders, total_quantity, total_amount_spent
 */
router.get("/salesperson/customer-report", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.customer_id,
        c.name AS customer_name,
        c.phone,
        c.email,
        COUNT(DISTINCT s.sale_id) AS total_orders,
        COALESCE(SUM(si.quantity), 0) AS total_quantity,
        COALESCE(SUM(s.total_amount), 0) AS total_amount_spent
      FROM Customer c
      LEFT JOIN Sale s ON s.customer_id = c.customer_id
      LEFT JOIN Sale_Item si ON si.sale_id = s.sale_id
      GROUP BY c.customer_id, c.name, c.phone, c.email
      ORDER BY total_amount_spent DESC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customer report", details: err.message });
  }
});

/**
 * GET /salesperson/daily-sales
 *
 * Daily sales report with order count
 *
 * DBMS Concepts:
 * - DATE() function to extract date from datetime
 * - GROUP BY date for daily aggregation
 */
router.get("/salesperson/daily-sales", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        DATE(s.sale_date) AS sale_date,
        COUNT(DISTINCT s.sale_id) AS total_orders,
        COUNT(si.sale_item_id) AS total_items,
        SUM(s.total_amount) AS total_sales_amount
      FROM Sale s
      INNER JOIN Sale_Item si ON si.sale_id = s.sale_id
      GROUP BY DATE(s.sale_date)
      ORDER BY sale_date DESC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch daily sales", details: err.message });
  }
});

/**
 * GET /salesperson/summary
 *
 * Overall sales summary (dashboard stats)
 *
 * DBMS Concepts:
 * - Multiple aggregate functions in single query
 * - Subqueries to get different metrics
 */
router.get("/salesperson/summary", async (req, res) => {
  try {
    // Get overall stats
    const [[salesStats]] = await pool.query(`
      SELECT 
        COUNT(DISTINCT sale_id) AS total_sales,
        COALESCE(SUM(total_amount), 0) AS total_revenue,
        COALESCE(AVG(total_amount), 0) AS avg_order_value
      FROM Sale
    `);

    const [[customerStats]] = await pool.query(`
      SELECT COUNT(*) AS total_customers FROM Customer
    `);

    const [[purchasedStats]] = await pool.query(`
      SELECT COUNT(DISTINCT customer_id) AS total_customers_purchased FROM Sale
    `);

    const [[productStats]] = await pool.query(`
      SELECT 
        COUNT(*) AS total_products,
        SUM(stock) AS total_stock
      FROM Product
    `);

    const [[todayStats]] = await pool.query(`
      SELECT 
        COUNT(DISTINCT sale_id) AS today_sales,
        COALESCE(SUM(total_amount), 0) AS today_revenue
      FROM Sale
      WHERE DATE(sale_date) = CURDATE()
    `);

    res.json({
      total_sales: salesStats.total_sales,
      total_revenue: salesStats.total_revenue,
      avg_order_value: salesStats.avg_order_value,
      total_customers: customerStats.total_customers,
      total_customers_purchased: purchasedStats.total_customers_purchased,
      total_products: productStats.total_products,
      total_stock: productStats.total_stock,
      today_sales: todayStats.today_sales,
      today_revenue: todayStats.today_revenue,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch summary", details: err.message });
  }
});

/**
 * GET /salesperson/revenue-by-salesperson
 * Total revenue and sales count per salesperson (DBMS: GROUP BY, SUM, JOIN)
 */
router.get("/salesperson/revenue-by-salesperson", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        sp.salesperson_id,
        sp.name AS salesperson_name,
        sp.email,
        COUNT(DISTINCT s.sale_id) AS total_sales,
        COALESCE(SUM(s.total_amount), 0) AS total_revenue
      FROM Salesperson sp
      LEFT JOIN Sale s ON s.salesperson_id = sp.salesperson_id
      GROUP BY sp.salesperson_id, sp.name, sp.email
      ORDER BY total_revenue DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch revenue by salesperson", details: err.message });
  }
});

/**
 * GET /salesperson/recent-sales
 *
 * Recent sales with customer and product details
 */
router.get("/salesperson/recent-sales", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        s.sale_id,
        s.sale_date,
        s.total_amount,
        c.name AS customer_name,
        c.phone AS customer_phone,
        p.mode AS payment_mode,
        p.status AS payment_status,
        GROUP_CONCAT(CONCAT(pr.name, ' (x', si.quantity, ')') SEPARATOR ', ') AS items
      FROM Sale s
      INNER JOIN Customer c ON c.customer_id = s.customer_id
      INNER JOIN Payment p ON p.sale_id = s.sale_id
      INNER JOIN Sale_Item si ON si.sale_id = s.sale_id
      INNER JOIN Product pr ON pr.product_id = si.product_id
      GROUP BY s.sale_id, s.sale_date, s.total_amount, c.name, c.phone, p.mode, p.status
      ORDER BY s.sale_date DESC
      LIMIT 20
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch recent sales", details: err.message });
  }
});

module.exports = router;
