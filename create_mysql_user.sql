-- ============================================================
-- Run this script AS MySQL root to create the application user
-- ============================================================
-- In MySQL Workbench: Login as root, then run this script
-- Or via CLI: mysql -u root -p < create_mysql_user.sql
-- ============================================================

-- Drop user if exists (safe re-run)
DROP USER IF EXISTS 'dbms_user'@'localhost';

-- Create user with password
CREATE USER 'dbms_user'@'localhost' IDENTIFIED BY 'dbms123';

-- Grant full access to the intelligent_sales database
GRANT ALL PRIVILEGES ON intelligent_sales.* TO 'dbms_user'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify user was created
SELECT User, Host FROM mysql.user WHERE User = 'dbms_user';

-- Done!
SELECT 'MySQL user dbms_user created successfully!' AS status;
