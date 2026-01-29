-- ============================================================
-- Intelligent Sales & Product Recommendation System
-- DBMS Project (MySQL)
-- ============================================================
-- This script includes:
-- 1) 3NF tables with PK/FK constraints
-- 2) Stored Procedure: make_sale(customer_id, product_id, quantity)
-- 3) Trigger: AFTER INSERT on Sale_Item (stock enforcement at DB level)
-- 4) View: daily_sales_report (daily total sales)
-- 5) Sample data (>=30 products, 2 customers) + sample sales using procedure
--
-- NOTE (for viva):
-- - "Semantic search" in this project is NOT AI/ML.
--   It is SQL-based keyword matching using LIKE + a relevance score.
-- - We demonstrate ACID via transaction inside the stored procedure.
-- - We demonstrate business rules using triggers at database level.
-- ============================================================

CREATE DATABASE IF NOT EXISTS intelligent_sales;
USE intelligent_sales;

-- ------------------------------------------------------------
-- Drop objects (safe re-run for demo)
-- ------------------------------------------------------------
DROP VIEW IF EXISTS daily_sales_report;
DROP TRIGGER IF EXISTS trg_sale_item_after_insert;
DROP PROCEDURE IF EXISTS make_sale;

DROP TABLE IF EXISTS Payment;
DROP TABLE IF EXISTS Sale_Item;
DROP TABLE IF EXISTS Sale;
DROP TABLE IF EXISTS Salesperson;
DROP TABLE IF EXISTS Product_Embedding;
DROP TABLE IF EXISTS Product;
DROP TABLE IF EXISTS Customer;

-- ------------------------------------------------------------
-- 1) MASTER TABLES (3NF)
-- ------------------------------------------------------------
CREATE TABLE Customer (
  customer_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) UNIQUE,
  email VARCHAR(100) UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Product (
  product_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL,
  description TEXT,
  CHECK (price >= 0),
  CHECK (stock >= 0)
);

-- "Embedding" is stored as TEXT for academic demo.
-- This is NOT used for real ML; it just represents a placeholder concept.
CREATE TABLE Product_Embedding (
  embedding_id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  vector TEXT,
  UNIQUE KEY uq_embedding_product (product_id),
  FOREIGN KEY (product_id) REFERENCES Product(product_id)
);

CREATE TABLE Salesperson (
  salesperson_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 2) TRANSACTIONAL TABLES (3NF)
-- ------------------------------------------------------------
CREATE TABLE Sale (
  sale_id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  salesperson_id INT NULL,
  sale_date DATETIME NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
  FOREIGN KEY (salesperson_id) REFERENCES Salesperson(salesperson_id)
);

-- Sale_Item is line-item details (supports 1-to-many sale items).
CREATE TABLE Sale_Item (
  sale_item_id INT PRIMARY KEY AUTO_INCREMENT,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES Sale(sale_id),
  FOREIGN KEY (product_id) REFERENCES Product(product_id),
  CHECK (quantity > 0),
  CHECK (price >= 0)
);

CREATE TABLE Payment (
  payment_id INT PRIMARY KEY AUTO_INCREMENT,
  sale_id INT NOT NULL,
  mode VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES Sale(sale_id)
);

-- Helpful indexes for reports/search
CREATE INDEX idx_product_category ON Product(category);
CREATE INDEX idx_sale_date ON Sale(sale_date);
CREATE INDEX idx_sale_item_product ON Sale_Item(product_id);

-- ------------------------------------------------------------
-- 3) STORED PROCEDURE (ACID transaction demo)
-- ------------------------------------------------------------
DELIMITER $$
CREATE PROCEDURE make_sale(IN p_customer_id INT, IN p_product_id INT, IN p_quantity INT, IN p_salesperson_id INT)
BEGIN
  -- DBMS Concept: Stored Procedure encapsulates business logic inside DB.
  -- DBMS Concept: Transaction ensures Atomicity & Consistency (ACID).

  DECLARE v_price DECIMAL(10,2);
  DECLARE v_stock INT;
  DECLARE v_sale_id INT;
  DECLARE v_total DECIMAL(10,2);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantity must be greater than 0';
  END IF;

  START TRANSACTION;

  SELECT price, stock INTO v_price, v_stock
  FROM Product
  WHERE product_id = p_product_id
  FOR UPDATE;

  IF v_price IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid product_id';
  END IF;

  IF v_stock < p_quantity THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock';
  END IF;

  INSERT INTO Sale(customer_id, salesperson_id, sale_date, total_amount)
  VALUES (p_customer_id, NULLIF(p_salesperson_id, 0), NOW(), 0);

  SET v_sale_id = LAST_INSERT_ID();

  -- IMPORTANT for viva:
  -- We also have an AFTER INSERT trigger on Sale_Item that reduces stock.
  -- To avoid DOUBLE reduction, we set a session variable to tell trigger
  -- "this insert is coming from make_sale procedure".
  SET @from_make_sale := 1;

  -- Insert sale item
  INSERT INTO Sale_Item(sale_id, product_id, quantity, price)
  VALUES (v_sale_id, p_product_id, p_quantity, v_price);

  SET @from_make_sale := 0;

  -- Update stock (explicit step inside procedure as required)
  UPDATE Product
  SET stock = stock - p_quantity
  WHERE product_id = p_product_id;

  SET v_total = v_price * p_quantity;

  UPDATE Sale
  SET total_amount = v_total
  WHERE sale_id = v_sale_id;

  -- Record payment (simple demo: mode/status can be updated by app)
  INSERT INTO Payment(sale_id, mode, status)
  VALUES (v_sale_id, 'CASH', 'SUCCESS');

  COMMIT;

  -- Return generated sale id and total amount to the application
  SELECT v_sale_id AS sale_id, v_total AS total_amount;
END$$
DELIMITER ;

-- ------------------------------------------------------------
-- 4) TRIGGER (Business rule at DB level)
-- ------------------------------------------------------------
DELIMITER $$
CREATE TRIGGER trg_sale_item_after_insert
AFTER INSERT ON Sale_Item
FOR EACH ROW
BEGIN
  -- DBMS Concept: Trigger enforces rule even if app bypasses procedure.
  -- Rule: Stock must reduce when a sale item is inserted.

  IF IFNULL(@from_make_sale, 0) = 0 THEN
    UPDATE Product
    SET stock = stock - NEW.quantity
    WHERE product_id = NEW.product_id;

    -- Enforce "no negative stock"
    IF (SELECT stock FROM Product WHERE product_id = NEW.product_id) < 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock cannot be negative';
    END IF;
  END IF;
END$$
DELIMITER ;

-- ------------------------------------------------------------
-- 5) VIEW (Reports)
-- ------------------------------------------------------------
CREATE VIEW daily_sales_report AS
SELECT
  DATE(sale_date) AS sale_date,
  SUM(total_amount) AS total_sales_amount
FROM Sale
GROUP BY DATE(sale_date)
ORDER BY DATE(sale_date) DESC;

-- ------------------------------------------------------------
-- 6) SAMPLE DATA
-- ------------------------------------------------------------
INSERT INTO Customer(name, phone, email) VALUES
('Aarav Sharma', '9876543210', 'aarav@example.com'),
('Neha Verma', '9123456780', 'neha@example.com');

-- 30+ products (mix categories + descriptions for keyword search)
INSERT INTO Product(name, category, price, stock, description) VALUES
('Campus Camera Phone A1', 'Phone', 12999.00, 30, 'Affordable phone with good camera for students. Lightweight and long battery.'),
('Budget Camera Phone B2', 'Phone', 9999.00, 25, 'Cheap smartphone with decent camera and 5000mAh battery for daily use.'),
('Premium Camera Phone P9', 'Phone', 54999.00, 10, 'Flagship phone with advanced camera, OIS, and great low-light photos.'),
('Student Laptop L1', 'Laptop', 39999.00, 12, 'Laptop for students: lightweight, good battery, perfect for coding and assignments.'),
('Office Laptop O2', 'Laptop', 45999.00, 15, 'Work laptop with SSD, good keyboard, and productivity features.'),
('Gaming Laptop G7', 'Laptop', 89999.00, 6, 'High performance gaming laptop with dedicated GPU and cooling.'),
('Wireless Earbuds E1', 'Audio', 1499.00, 40, 'Affordable earbuds with clear sound, mic, and good battery life.'),
('Noise Cancelling Headphones H2', 'Audio', 6999.00, 18, 'Over-ear headphones with noise cancelling and deep bass.'),
('Bluetooth Speaker S3', 'Audio', 2499.00, 22, 'Portable speaker for travel, loud sound, and long battery.'),
('Smartwatch W1', 'Wearable', 1999.00, 35, 'Fitness watch with step counter, heart rate, and sleep tracking.'),
('Smartwatch W2 Pro', 'Wearable', 4999.00, 20, 'AMOLED smartwatch with GPS and multiple sports modes.'),
('Power Bank PB10', 'Accessories', 999.00, 60, '10000mAh power bank for students and travel, fast charging support.'),
('Power Bank PB20', 'Accessories', 1499.00, 50, '20000mAh power bank, dual output, reliable and safe.'),
('USB-C Cable C1', 'Accessories', 199.00, 200, 'Durable USB-C cable, fast charging and data sync.'),
('Fast Charger 30W', 'Accessories', 799.00, 80, '30W fast charger for phones, safe and efficient.'),
('Backpack for Laptop', 'Accessories', 1299.00, 45, 'Water-resistant backpack for students, fits 15-inch laptop.'),
('Wireless Mouse M1', 'Accessories', 499.00, 90, 'Ergonomic wireless mouse for office and students.'),
('Mechanical Keyboard K1', 'Accessories', 2499.00, 25, 'Mechanical keyboard with tactile switches for coding and gaming.'),
('LED Desk Lamp', 'Home', 899.00, 30, 'Study lamp with adjustable brightness, perfect for students.'),
('Notebook Set (Pack of 5)', 'Stationery', 299.00, 120, 'Exam-ready notebooks for students, smooth paper.'),
('Pen Combo Pack', 'Stationery', 149.00, 180, 'Smooth writing pens for notes and exams.'),
('Calculator Basic', 'Stationery', 399.00, 70, 'Basic calculator for classroom and practical exams.'),
('Router R1', 'Networking', 1599.00, 28, 'WiFi router for home, stable connection for online classes.'),
('Router R2 Dual Band', 'Networking', 2799.00, 18, 'Dual band router for faster speed and better coverage.'),
('External SSD 512GB', 'Storage', 5499.00, 16, 'Fast external SSD for projects and backups, USB 3.2.'),
('External HDD 1TB', 'Storage', 3999.00, 20, 'Portable hard drive 1TB for storing documents and media.'),
('Printer P1', 'Office', 7999.00, 8, 'All-in-one printer for assignments, scanning, and printing.'),
('Webcam 1080p', 'Office', 1999.00, 25, 'Full HD webcam for online classes and meetings.'),
('Tripod for Phone', 'Accessories', 699.00, 40, 'Tripod for phone camera, useful for students and content creation.'),
('Phone Case Shockproof', 'Accessories', 249.00, 150, 'Shockproof case to protect phone from drops.');

-- Dummy embedding vectors (placeholder concept)
INSERT INTO Product_Embedding(product_id, vector) VALUES
(1, '[0.10,0.20,0.30]'),
(2, '[0.05,0.15,0.25]'),
(3, '[0.90,0.80,0.70]'),
(4, '[0.20,0.40,0.60]'),
(5, '[0.30,0.50,0.70]');

-- Sample sales using the stored procedure (salesperson_id 0 = NULL)
CALL make_sale(1, 1, 2, 0);
CALL make_sale(2, 7, 1, 0);
CALL make_sale(1, 12, 3, 0);
CALL make_sale(2, 4, 1, 0);

