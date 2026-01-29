-- ============================================================
-- Migration: Remove password-based auth (academic DBMS project).
-- Run only on a database that ALREADY has password_hash on
-- Customer and/or Salesperson (e.g. after db_migration_auth.sql).
-- If you get "Unknown column 'password_hash'", the column is
-- already gone — skip or use a fresh db_setup.sql.
-- ============================================================
USE intelligent_sales;

-- Drop password column from Customer
ALTER TABLE Customer DROP COLUMN password_hash;

-- Drop password column from Salesperson
ALTER TABLE Salesperson DROP COLUMN password_hash;

SELECT 'Password columns removed. Auth is now identity-only (email/phone or email/employee_id).' AS status;
