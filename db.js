const mysql = require("mysql2/promise");

// ============================================================
// 🔧 DATABASE CONFIGURATION - CHANGE THESE SETTINGS
// ============================================================
// Instructions:
// 1. Change DB_PASSWORD to your MySQL password (leave empty "" if no password)
// 2. Change DB_NAME if you want a different database name
// 3. Change DB_PORT if your MySQL runs on a different port
// ============================================================

const DB_HOST = "localhost";           // MySQL host (usually localhost)
const DB_USER = "root";                // MySQL username (usually root)
const DB_PASSWORD = "";                // 🔐 YOUR MYSQL PASSWORD HERE (empty for XAMPP)
const DB_NAME = "intelligent_sales";   // Database name
const DB_PORT = 3306;                  // MySQL port (3306 is default)

// ============================================================

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test database connection
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log("✅ DB CONNECTED");
    console.log(`📊 Database: ${DB_NAME}`);
    console.log(`🔌 Host: ${DB_HOST}:${DB_PORT}`);
    console.log(`👤 User: ${DB_USER}`);
    conn.release();
  } catch (err) {
    console.error("❌ DB CONNECTION FAILED:");
    console.error("Error:", err.message);
    console.error("Code:", err.code);
    console.error("\n💡 Troubleshooting tips:");
    console.error("   1. Check if MySQL is running");
    console.error("   2. Verify password in db.js");
    console.error("   3. Make sure database exists");
    console.error("   4. Check if port", DB_PORT, "is correct");
  }
}

module.exports = {
  pool,
  testConnection,
};