/**
 * routes/customer.js
 *
 * Customer identity only (NO passwords — academic DBMS project)
 *
 * APIs:
 * - POST /api/customer/signup
 * - POST /api/customer/login
 * - GET  /api/customer/:id
 * - GET  /api/customer/:id/orders
 */

const express = require("express");
const { pool } = require("../db");

const router = express.Router();

/* =====================================================
   SIGN UP
   ===================================================== */
router.post("/customer/signup", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").trim() || null;

    // ✅ Signup validation
    if (!name || name.length < 2) {
      return res.status(400).json({ error: "Name is required (min 2 characters)" });
    }
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check duplicate
    const [existing] = await pool.query(
      "SELECT customer_id FROM Customer WHERE email = ? OR phone = ?",
      [email, phone]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email or phone already registered" });
    }

    // Insert customer
    const [result] = await pool.query(
      "INSERT INTO Customer (name, email, phone) VALUES (?, ?, ?)",
      [name, email, phone]
    );

    const [rows] = await pool.query(
      "SELECT customer_id, name, email, phone, created_at FROM Customer WHERE customer_id = ?",
      [result.insertId]
    );

    res.status(201).json({
      message: "Signup successful",
      customer: rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Signup failed", details: err.message });
  }
});

/* =====================================================
   LOGIN  (NO NAME REQUIRED ❗)
   ===================================================== */
router.post("/customer/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").trim();

    // ✅ Login validation (NO name here)
    if (!email && !phone) {
      return res.status(400).json({ error: "Email or phone is required to login" });
    }

    const [rows] = await pool.query(
      `SELECT customer_id, name, email, phone, created_at
       FROM Customer
       WHERE email = ? OR phone = ?
       LIMIT 1`,
      [email || null, phone || null]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json({
      message: "Login successful",
      customer: rows[0],
    });
  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);
    res.status(500).json({ error: "Login failed", details: err.message || String(err) });
  }
});

/* =====================================================
   GET CUSTOMER BY ID
   ===================================================== */
router.get("/customer/:id", async (req, res) => {
  try {
    const customerId = Number(req.params.id);
    if (!customerId) {
      return res.status(400).json({ error: "Invalid customer ID" });
    }

    const [rows] = await pool.query(
      "SELECT customer_id, name, email, phone, created_at FROM Customer WHERE customer_id = ?",
      [customerId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customer", details: err.message });
  }
});

/* =====================================================
   CUSTOMER ORDER HISTORY
   ===================================================== */
router.get("/customer/:id/orders", async (req, res) => {
  try {
    const customerId = Number(req.params.id);
    if (!customerId) {
      return res.status(400).json({ error: "Invalid customer ID" });
    }

    const [rows] = await pool.query(
      `SELECT
        s.sale_id, s.sale_date, s.total_amount,
        p.mode AS payment_mode, p.status AS payment_status,
        si.product_id, pr.name AS product_name,
        si.quantity, si.price AS unit_price
      FROM Sale s
      JOIN Payment p ON p.sale_id = s.sale_id
      JOIN Sale_Item si ON si.sale_id = s.sale_id
      JOIN Product pr ON pr.product_id = si.product_id
      WHERE s.customer_id = ?
      ORDER BY s.sale_date DESC`,
      [customerId]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders", details: err.message });
  }
});

module.exports = router;
