/**
 * routes/sales.js
 *
 * APIs:
 * - POST /sale   -> calls stored procedure make_sale(customer_id, product_id, quantity)
 *
 * Extra (useful for UI):
 * - GET /customers -> list customers for dropdown
 *
 * DBMS note (for viva):
 * - Stored procedure demonstrates transaction (START TRANSACTION / COMMIT / ROLLBACK).
 * - App calls procedure instead of manually doing multiple SQL statements.
 */

const express = require("express");
const { pool } = require("../db");

const router = express.Router();

router.get("/customers", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT customer_id, name FROM Customer ORDER BY customer_id");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customers", details: err.message });
  }
});

router.post("/sale", async (req, res) => {
  try {
    const customer_id = Number(req.body.customer_id);
    const product_id = Number(req.body.product_id);
    const quantity = Number(req.body.quantity);
    const salesperson_id = Number(req.body.salesperson_id) || 0;
    const payment_mode = String(req.body.payment_mode || "CASH").toUpperCase().slice(0, 20);

    if (!Number.isInteger(customer_id) || customer_id <= 0) {
      return res.status(400).json({ error: "Invalid customer_id" });
    }
    if (!Number.isInteger(product_id) || product_id <= 0) {
      return res.status(400).json({ error: "Invalid product_id" });
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    // Call stored procedure (4 params: customer_id, product_id, quantity, salesperson_id; 0 = NULL)
    const [rows] = await pool.query("CALL make_sale(?,?,?,?)", [customer_id, product_id, quantity, salesperson_id]);
    const out = rows && rows[0] && rows[0][0] ? rows[0][0] : null;

    if (!out || !out.sale_id) {
      return res.status(500).json({ error: "Sale created but no output returned from procedure" });
    }

    // Update payment mode (optional; keeps procedure signature simple)
    await pool.query("UPDATE Payment SET mode = ? WHERE sale_id = ?", [payment_mode, out.sale_id]);

    res.json({
      message: "Sale completed successfully",
      sale_id: out.sale_id,
      total_amount: out.total_amount,
      payment_mode,
    });
  } catch (err) {
    // Procedure errors (SIGNAL) will come here too
    res.status(400).json({ error: "Sale failed", details: err.message });
  }
});

module.exports = router;

