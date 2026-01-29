-- ============================================================
-- Migration: Add Customer auth (password_hash, created_at),
-- Salesperson table, and salesperson_id on Sale.
-- Run this on an EXISTING intelligent_sales database.
-- ============================================================
USE intelligent_sales;

-- ------------------------------------------------------------
-- 1) Customer: add password_hash and created_at (run once)
-- ------------------------------------------------------------
ALTER TABLE Customer ADD COLUMN password_hash VARCHAR(255) NULL;
ALTER TABLE Customer ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
-- Optional: make email unique for login (fails if duplicates exist)
-- ALTER TABLE Customer ADD UNIQUE KEY uq_customer_email (email);

-- ------------------------------------------------------------
-- 2) Salesperson table (3NF)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Salesperson (
  salesperson_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 3) Sale: add salesperson_id FK (run once)
-- ------------------------------------------------------------
ALTER TABLE Sale ADD COLUMN salesperson_id INT NULL;
ALTER TABLE Sale ADD CONSTRAINT fk_sale_salesperson
  FOREIGN KEY (salesperson_id) REFERENCES Salesperson(salesperson_id);

-- ------------------------------------------------------------
-- 4) Recreate make_sale to accept salesperson_id
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS make_sale;

DELIMITER $$
CREATE PROCEDURE make_sale(
  IN p_customer_id INT,
  IN p_product_id INT,
  IN p_quantity INT,
  IN p_salesperson_id INT
)
BEGIN
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

  SET @from_make_sale := 1;
  INSERT INTO Sale_Item(sale_id, product_id, quantity, price)
  VALUES (v_sale_id, p_product_id, p_quantity, v_price);
  SET @from_make_sale := 0;

  UPDATE Product SET stock = stock - p_quantity WHERE product_id = p_product_id;

  SET v_total = v_price * p_quantity;
  UPDATE Sale SET total_amount = v_total WHERE sale_id = v_sale_id;

  INSERT INTO Payment(sale_id, mode, status) VALUES (v_sale_id, 'CASH', 'SUCCESS');

  COMMIT;

  SELECT v_sale_id AS sale_id, v_total AS total_amount;
END$$
DELIMITER ;

-- Sample salesperson for testing (password: sales123)
-- Run after app has hashed it, or insert with a known hash
-- INSERT INTO Salesperson (name, email, password_hash) VALUES ('Admin Sales', 'sales@example.com', '<bcrypt_hash>');

SELECT 'Migration completed. Customer has password_hash/created_at; Salesperson table created; Sale.salesperson_id added; make_sale updated.' AS status;
