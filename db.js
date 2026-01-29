const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",   // ✅ XAMPP default - no password
  database: "intelligent_sales",
  port: 3306,              // ✅ correct port (XAMPP default)
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ✅ ADD THIS FUNCTION
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log("DB CONNECTED");
    conn.release();
  } catch (err) {
    console.error("DB CONNECTION FAILED:", err.message);
  }
}

module.exports = {
  pool,
  testConnection,
};
