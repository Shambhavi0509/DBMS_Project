# 🛒 Intelligent Sales & Product Recommendation System

A complete DBMS project demonstrating **SQL concepts** including 3NF design, stored procedures, triggers, views, and aggregate queries. Built with **Node.js**, **Express**, and **MySQL**.

---

## 📋 Prerequisites

Before you begin, make sure you have these installed on your computer:

1. **XAMPP** (for MySQL database)
   - Download from: https://www.apachefriends.org/
   - Install and note the installation path (usually `C:\xampp`)

2. **Node.js** (version 14 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: Open PowerShell and type `node --version`

3. **A web browser** (Chrome, Firefox, or Edge)

---

## 🚀 Installation & Setup

### Step 1: Start MySQL Server

1. Open XAMPP Control Panel
2. Click **Start** next to MySQL
3. Wait until it shows "Running" status
   
   **Alternative (if XAMPP is not starting):**
   ```powershell
   cd C:\xampp\mysql\bin
   .\mysqld.exe --standalone
   ```

### Step 2: Install Project Dependencies

Open PowerShell in the project folder and run:

```powershell
npm install
```

This will install all required packages (Express, MySQL, CORS, etc.)

### Step 3: Setup the Database

**Option A: Using PowerShell (Command Line)**

Run this command to create the database and tables with sample data:

```powershell
Get-Content db_setup.sql | & "C:\xampp\mysql\bin\mysql.exe" -u root
```

**Option B: Using MySQL Workbench (GUI)**

1. Open **MySQL Workbench**
2. Click on your local MySQL connection (usually `Local instance 3306`)
3. If prompted for password, leave it blank and click OK
4. In the menu, go to **File → Open SQL Script**
5. Browse and select `db_setup.sql` from your project folder
6. Click the **⚡ Execute** button (lightning icon) or press `Ctrl+Shift+Enter`
7. Wait for the script to complete (you'll see "Action Output" at the bottom)
8. Refresh the Schemas panel (right-click → Refresh All)
9. You should see `intelligent_sales` database with all tables

✅ This will:
- Create `intelligent_sales` database
- Create all tables (Customer, Product, Sale, Payment, etc.)
- Insert 30+ sample products
- Add sample sales data

### Step 4: Configure Database Connection

The database connection is already configured in `db.js`:
- **Host:** localhost
- **User:** root
- **Password:** (empty - XAMPP default)
- **Database:** intelligent_sales
- **Port:** 3306

**If you have a different MySQL password or using MySQL Workbench with password:**
1. Open `db.js` file
2. Find the line: `password: "",`
3. Change it to: `password: "your_password_here",`
4. Save the file

---

## ▶️ Running the Application

### Start the Server

```powershell
node server.js
```

You should see:
```
✅ products routes file loaded
DB CONNECTED
Server running on http://localhost:3000
```

### Access the Application

Open your browser and go to:
- **Home Page:** http://localhost:3000
- **Customer Login:** http://localhost:3000/customer_login.html
- **Salesperson Dashboard:** http://localhost:3000/salesperson_login.html

---

## 🎯 Features & How to Use

### 👤 Customer Portal

1. **Sign Up:**
   - Go to Customer Login page
   - Click "Sign up" tab
   - Enter: Name, Email, Phone
   - Click "Sign up" button

2. **Login:**
   - Go to Customer Login page
   - Enter Email OR Phone
   - Click "Login" button

3. **Browse Products:**
   - View all available products
   - Search products by name/category
   - See product details and stock

4. **Make Purchase:**
   - Select products
   - Enter quantity
   - Complete purchase
   - View order history

### 📊 Sales Person Portal

1. **Login:**
   - Enter Email or Employee ID
   - Access dashboard

2. **View Reports:**
   - Daily sales summary
   - Top-selling products
   - Customer statistics
   - Revenue reports

---

## 📚 DBMS Concepts Demonstrated

This project showcases key database concepts for your viva:

### 1️⃣ **3NF Database Design**
- No redundancy
- Proper table relationships
- Tables: Customer, Product, Sale, Sale_Item, Payment, Salesperson

### 2️⃣ **Primary & Foreign Keys**
```sql
customer_id (PK) → Sale.customer_id (FK)
product_id (PK) → Sale_Item.product_id (FK)
```

### 3️⃣ **Stored Procedure**
```sql
CALL make_sale(customer_id, product_id, quantity, salesperson_id)
```
- Implements ACID transaction
- Automatic stock deduction
- Payment record creation

### 4️⃣ **Trigger**
```sql
AFTER INSERT on Sale_Item
```
- Automatically updates product stock
- Enforces business rules at database level

### 5️⃣ **Views**
```sql
daily_sales_report
```
- Aggregates daily sales data
- Simplifies complex queries

### 6️⃣ **JOIN Operations**
- Inner joins across multiple tables
- Customer order history
- Product sales analytics

### 7️⃣ **Aggregate Functions**
```sql
SUM(), COUNT(), AVG(), GROUP BY
```
- Sales summaries
- Revenue calculations
- Top products ranking

---

## 🗂️ Project Structure

```
DBMS_Project/
│
├── server.js              # Main Express server
├── db.js                  # Database connection
├── db_setup.sql          # Database schema & sample data
├── package.json          # Project dependencies
│
├── routes/               # API routes
│   ├── customer.js       # Customer login, signup, orders
│   ├── salesperson.js    # Salesperson operations
│   ├── products.js       # Product listing, search
│   ├── sales.js          # Create sales
│   └── reports.js        # Analytics & reports
│
└── public/               # Frontend files
    ├── index.html        # Home page
    ├── customer_login.html
    ├── customer_dashboard.html
    ├── salesperson_login.html
    ├── salesperson_dashboard.html
    ├── products.html
    ├── sale.html
    ├── reports.html
    └── styles.css        # Enhanced modern UI
```

---

## 🛠️ Troubleshooting

### ❌ Problem: "DB CONNECTION FAILED"

**Solution:**
1. Make sure MySQL is running in XAMPP
2. Check if port 3306 is available:
   ```powershell
   netstat -ano | findstr :3306
   ```
3. Test MySQL connection:
   ```powershell
   & "C:\xampp\mysql\bin\mysql.exe" -u root -e "SELECT 1;"
   ```

### ❌ Problem: "Unknown database 'intelligent_sales'"

**Solution (PowerShell):**
```powershell
Get-Content db_setup.sql | & "C:\xampp\mysql\bin\mysql.exe" -u root
```

**Solution (MySQL Workbench):**
1. Open MySQL Workbench
2. Connect to your local instance
3. File → Open SQL Script → Select `db_setup.sql`
4. Click Execute (⚡) button
5. Refresh the Schemas panel

### ❌ Problem: "Port 3000 is already in use"

**Solution:**
1. Stop any running Node.js processes:
   ```powershell
   Stop-Process -Name node -Force
   ```
2. Or use a different port in `server.js`:
   ```javascript
   const PORT = 3001; // Change to any available port
   ```

### ❌ Problem: "Cannot find module 'express'"

**Solution:**
Install dependencies again:
```powershell
npm install
```

### ❌ Problem: Login returns 500 error

**Solution:**
1. Check MySQL is connected: Look for "DB CONNECTED" in terminal
2. **Verify database exists:**
   
   **PowerShell:**
   ```powershell
   & "C:\xampp\mysql\bin\mysql.exe" -u root -e "SHOW DATABASES LIKE 'intelligent_sales';"
   ```
   
   **MySQL Workbench:**
   - Open MySQL Workbench
   - Run query: `SHOW DATABASES LIKE 'intelligent_sales';`
   - If empty, run the `db_setup.sql` script again

3. Restart the server

---

## 🎓 For Viva Preparation

### Key Points to Remember:

1. **What is normalization?**
   - Our database is in 3NF (Third Normal Form)
   - No transitive dependencies
   - Each table serves a single purpose

2. **Why use stored procedures?**
   - Ensures data integrity (ACID properties)
   - Reduces network traffic
   - Centralizes business logic

3. **Purpose of triggers?**
   - Automatic stock updates
   - Enforces business rules
   - Maintains data consistency

4. **What is a view?**
   - Virtual table from query results
   - Simplifies complex queries
   - Used for reporting

5. **ACID Properties in our project:**
   - **Atomicity:** Sale transaction commits/rolls back completely
   - **Consistency:** Stock never goes negative
   - **Isolation:** Concurrent sales don't conflict
   - **Durability:** Sales are permanently stored

---

## 📝 API Endpoints

### Customer APIs
- `POST /api/customer/signup` - Register new customer
- `POST /api/customer/login` - Customer login
- `GET /api/customer/:id` - Get customer details
- `GET /api/customer/:id/orders` - Order history

### Product APIs
- `GET /api/products` - List all products
- `GET /api/search?q=keyword` - Search products

### Sales APIs
- `POST /api/sale` - Create new sale
- `GET /api/customers` - List customers for sale

### Reports APIs
- `GET /api/reports/daily-sales` - Daily sales report
- `GET /api/reports/top-products` - Top selling products

### Salesperson APIs
- `GET /api/salesperson/customers` - Customer list
- `GET /api/salesperson/summary` - Sales summary
- `GET /api/salesperson/daily-sales` - Daily sales data

---

## 🎨 Features

- ✨ **Modern UI** with animations and gradients
- 📱 **Responsive Design** - works on all devices
- 🔍 **Product Search** - SQL LIKE-based search
- 📊 **Real-time Reports** - aggregated from database
- 🎯 **No Authentication** - Academic project (identity-only)
- ⚡ **Fast Performance** - optimized SQL queries

---

## 📞 Need Help?

If you encounter any issues:

1. Check the Troubleshooting section above
2. Verify all prerequisites are installed
3. Ensure MySQL is running
4. Check terminal for error messages

---

## 📄 License

This is an academic DBMS project. Feel free to use it for learning purposes.

---

## 🎉 You're Ready!

Your application should now be running at **http://localhost:3000**

Enjoy exploring the Intelligent Sales & Product Recommendation System! 🚀
