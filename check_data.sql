-- ============================================================
-- Quick queries to check your database data
-- Run these in MySQL Workbench to see what's stored
-- ============================================================

-- 1. Check if database exists
SHOW DATABASES LIKE 'intelligent_sales';

-- 2. Use the database
USE intelligent_sales;

-- 3. Show all tables
SHOW TABLES;

-- 4. View all customers
SELECT * FROM Customer;

-- 5. View all products (first 10)
SELECT * FROM Product LIMIT 10;

-- 6. View all sales
SELECT * FROM Sale;

-- 7. View all salespersons
SELECT * FROM Salesperson;

-- 8. Count records in each table
SELECT 'Customers' AS Table_Name, COUNT(*) AS Record_Count FROM Customer
UNION ALL
SELECT 'Products', COUNT(*) FROM Product
UNION ALL
SELECT 'Sales', COUNT(*) FROM Sale
UNION ALL
SELECT 'Salespersons', COUNT(*) FROM Salesperson;

-- 9. Check latest customer signup
SELECT * FROM Customer ORDER BY created_at DESC LIMIT 5;

-- 10. View customer details with their email
SELECT customer_id, name, email, phone, created_at 
FROM Customer 
ORDER BY customer_id DESC;
