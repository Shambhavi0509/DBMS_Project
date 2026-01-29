# Auth & Search Setup (No Passwords)

This is an **academic DBMS project**. Authentication is **identity-only** — no passwords, no bcrypt, no JWT.

## Product search
- **GET /api/search?q=keyword** — SQL LIKE on product name, category, description.

## Database: New install vs existing

### New install (empty database)
```bash
mysql -u root -p < db_setup.sql
```
Creates Customer (email UNIQUE, phone UNIQUE, no password), Salesperson (email UNIQUE, no password), Sale.salesperson_id, and the 4-param `make_sale` procedure.

### Existing database that has password_hash columns
If you previously ran db_migration_auth.sql and want to remove passwords:
```bash
mysql -u root -p intelligent_sales < db_migration_remove_passwords.sql
```
This drops `password_hash` from Customer and Salesperson. If you get "Unknown column", the columns are already gone.

## Customer auth (no password)
- **Sign up:** POST /api/customer/signup { name, email, phone }
- **Login:** POST /api/customer/login { email } OR { phone } — identity lookup only
- Customer table: email UNIQUE, phone UNIQUE. No password columns.

## Salesperson auth (no password)
- **Sign up:** POST /api/salesperson/signup { name, email }
- **Login:** POST /api/salesperson/login { email } OR { salesperson_id } (Employee ID) — identity lookup only
- Salesperson table: email UNIQUE. No password columns.

## Reports
- **Summary:** GET /api/salesperson/summary (includes total_customers_purchased)
- **Revenue by salesperson:** GET /api/salesperson/revenue-by-salesperson

## Frontend
- **Customer:** customer_login.html → Sign up (name, email, phone) / Login (email or phone) → customer_dashboard.html
- **Salesperson:** salesperson_login.html → Sign up (name, email) / Login (email or Employee ID) → salesperson_dashboard.html
- **Manual sale:** sale.html sends salesperson_id from sessionStorage if a salesperson is logged in; otherwise 0.
