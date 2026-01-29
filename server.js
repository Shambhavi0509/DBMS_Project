/**
 * server.js
 * Express server for "Intelligent Sales & Product Recommendation System"
 *
 * DBMS Concepts (for viva):
 * - Separation of concerns: Routes handle different entities (products, sales, customers)
 * - RESTful API design: GET for reading, POST for creating
 * - Role-based access: Customer vs Sales Person (UI-level separation, no auth)
 */

const path = require("path");
const express = require("express");
const cors = require("cors");

const db = require("./db");

// Route modules
const productsRoutes = require("./routes/products");
const salesRoutes = require("./routes/sales");
const reportsRoutes = require("./routes/reports");
const customerRoutes = require("./routes/customer");
const salespersonRoutes = require("./routes/salesperson");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, "public")));

// ============================================================
// API ROUTES
// ============================================================
// All routes are prefixed with /api for clean separation

// Product routes (search, list)
app.use("/api", productsRoutes);

// Sales routes (create sale, list customers)
app.use("/api", salesRoutes);

// Report routes (daily sales, top products)
app.use("/api", reportsRoutes);

// Customer routes (login/register, order history)
app.use("/api", customerRoutes);

// Sales Person routes (customer stats, reports)
app.use("/api", salespersonRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ ok: true, service: "Intelligent Sales System" });
});

// ============================================================
// START SERVER
// ============================================================
async function startServer() {
  try {
    await db.testConnection();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log("");
      console.log("API Endpoints:");
      console.log("  Products:     GET /api/products, GET /api/search?q=");
      console.log("  Customer:     POST /api/customer/login, GET /api/customer/:id/orders");
      console.log("  Sales:        POST /api/sale, GET /api/customers");
      console.log("  Sales Person: GET /api/salesperson/customers, /summary, /daily-sales");
      console.log("  Reports:      GET /api/reports/daily-sales, /top-products");
      console.log("");
      console.log("Frontend Pages:");
      console.log("  Home:         http://localhost:3000/");
      console.log("  Customer:     http://localhost:3000/customer_login.html");
      console.log("  Sales Person: http://localhost:3000/salesperson_dashboard.html");
    });
  } catch (err) {
    console.error("DB ERROR:", err.message);
    process.exit(1);
  }
}

startServer();
