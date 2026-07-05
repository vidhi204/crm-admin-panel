const path = require('path');
const bcrypt = require('bcryptjs');

const isPg = !!process.env.DATABASE_URL;

let dbInstance;
let queryWrappers = {};

if (isPg) {
  console.log("☁️ Connecting to PostgreSQL Cloud Database (Neon/Render)...");
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Neon.tech SSL connections
  });

  // Convert '?' placeholders to PostgreSQL '$1, $2' format
  function convertSql(sql) {
    let count = 1;
    return sql.replace(/\?/g, () => `$${count++}`);
  }

  queryWrappers.run = async (sql, params = []) => {
    let pgSql = convertSql(sql);
    // Append 'RETURNING id' to INSERT queries to get the newly generated SERIAL primary key
    if (sql.trim().toUpperCase().startsWith('INSERT ')) {
      pgSql = `${pgSql} RETURNING id`;
    }
    const res = await pool.query(pgSql, params);
    return {
      id: res.rows[0] ? res.rows[0].id : null,
      changes: res.rowCount
    };
  };

  queryWrappers.get = async (sql, params = []) => {
    const pgSql = convertSql(sql);
    const result = await pool.query(pgSql, params);
    return result.rows[0] || null;
  };

  queryWrappers.all = async (sql, params = []) => {
    const pgSql = convertSql(sql);
    const result = await pool.query(pgSql, params);
    return result.rows;
  };

  dbInstance = pool;
} else {
  console.log("💾 Connecting to Local SQLite Database...");
  const sqlite3 = require('sqlite3').verbose();
  const sqliteDbPath = path.join(__dirname, '../database.sqlite');
  const localDb = new sqlite3.Database(sqliteDbPath);

  queryWrappers.run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      localDb.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  };

  queryWrappers.get = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      localDb.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  };

  queryWrappers.all = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      localDb.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  dbInstance = localDb;
}

// Unified Schemas Table creation and Seeding logic
async function initializeDb() {
  const run = queryWrappers.run;
  const get = queryWrappers.get;

  if (isPg) {
    // PostgreSQL database schema
    await run(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL
    )`);

    await run(`CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      company VARCHAR(255),
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      status VARCHAR(50) NOT NULL,
      followUpDate VARCHAR(50),
      assignedTo INTEGER,
      notes TEXT
    )`);

    await run(`CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      company VARCHAR(255),
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      address TEXT,
      history TEXT
    )`);

    await run(`CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      priority VARCHAR(50) NOT NULL,
      dueDate VARCHAR(50) NOT NULL,
      assignedTo INTEGER NOT NULL,
      status VARCHAR(50) NOT NULL
    )`);

    await run(`CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      role VARCHAR(50) NOT NULL,
      department VARCHAR(255) NOT NULL,
      performance INTEGER NOT NULL
    )`);

    await run(`CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      companyName VARCHAR(255) NOT NULL,
      emailSettings VARCHAR(255) NOT NULL,
      smsSettings VARCHAR(255) NOT NULL,
      notifications TEXT NOT NULL
    )`);
  } else {
    // SQLite local file database schema
    await run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    )`);

    await run(`CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT,
      email TEXT NOT NULL,
      phone TEXT,
      status TEXT NOT NULL,
      followUpDate TEXT,
      assignedTo INTEGER,
      notes TEXT
    )`);

    await run(`CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT,
      email TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      history TEXT
    )`);

    await run(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      priority TEXT NOT NULL,
      dueDate TEXT NOT NULL,
      assignedTo INTEGER NOT NULL,
      status TEXT NOT NULL
    )`);

    await run(`CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      department TEXT NOT NULL,
      performance INTEGER NOT NULL
    )`);

    await run(`CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      companyName TEXT NOT NULL,
      emailSettings TEXT NOT NULL,
      smsSettings TEXT NOT NULL,
      notifications TEXT NOT NULL
    )`);
  }

  // Check if seeding is required (Users table check)
  const userCount = await get("SELECT COUNT(*) as count FROM users");
  if (userCount && Number(userCount.count) === 0) {
    console.log("🌱 Database is empty. Seeding initial crm data...");
    
    const salt = bcrypt.genSaltSync(10);
    const adminPassword = bcrypt.hashSync('admin123', salt);
    const managerPassword = bcrypt.hashSync('manager123', salt);
    const employeePassword = bcrypt.hashSync('employee123', salt);

    // Seed Users
    await run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", ['Super Admin', 'admin@crm.com', adminPassword, 'admin']);
    await run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", ['Jane Manager', 'manager@crm.com', managerPassword, 'manager']);
    await run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", ['Rahul Employee', 'employee@crm.com', employeePassword, 'employee']);

    // Seed Employees
    await run("INSERT INTO employees (name, email, role, department, performance) VALUES (?, ?, ?, ?, ?)", ['Super Admin', 'admin@crm.com', 'admin', 'Management', 95]);
    await run("INSERT INTO employees (name, email, role, department, performance) VALUES (?, ?, ?, ?, ?)", ['Jane Manager', 'manager@crm.com', 'manager', 'Sales Management', 88]);
    await run("INSERT INTO employees (name, email, role, department, performance) VALUES (?, ?, ?, ?, ?)", ['Rahul Employee', 'employee@crm.com', 'employee', 'Sales Execution', 91]);

    // Seed Leads
    await run("INSERT INTO leads (name, email, phone, company, status, notes, followUpDate, assignedTo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", ['Rahul Sharma', 'rahul@gmail.com', '9876543210', 'Sharma SEO', 'new', 'Interested in digital marketing services', '2026-07-06', 3]);
    await run("INSERT INTO leads (name, email, phone, company, status, notes, followUpDate, assignedTo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", ['Amit Patel', 'amit@yahoo.com', '9823456789', 'Patel Web Inc', 'contacted', 'Needs customized E-Commerce app quotes', '2026-07-08', 3]);
    await run("INSERT INTO leads (name, email, phone, company, status, notes, followUpDate, assignedTo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", ['Priya Shah', 'priya@outlook.com', '9898989898', 'Shah Interiors', 'qualified', 'Aligned on pricing; ready to review contract', '2026-07-05', 2]);
    await run("INSERT INTO leads (name, email, phone, company, status, notes, followUpDate, assignedTo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", ['Vikram Mehta', 'vikram@mehta.com', '9123456789', 'Mehta Group', 'won', 'Closed contract for full branding retainer', '2026-07-02', 3]);

    // Seed Customers
    await run("INSERT INTO customers (name, email, phone, company, address, history) VALUES (?, ?, ?, ?, ?, ?)", ['Vikram Mehta', 'vikram@mehta.com', '9123456789', 'Mehta Group', 'MG Road, Mumbai', 'Closed lead on 2026-07-02. Subscribed to Branding Package.']);
    await run("INSERT INTO customers (name, email, phone, company, address, history) VALUES (?, ?, ?, ?, ?, ?)", ['Sneha Gupta', 'sneha@guptas.com', '9765432109', 'Gupta & Sons', 'CG Road, Ahmedabad', 'Onboarded for Monthly SEO Retainer since May 2026.']);

    // Seed Tasks
    await run("INSERT INTO tasks (title, priority, status, assignedTo, dueDate) VALUES (?, ?, ?, ?, ?)", ['Follow up with Amit Patel', 'high', 'pending', 3, '2026-07-08']);
    await run("INSERT INTO tasks (title, priority, status, assignedTo, dueDate) VALUES (?, ?, ?, ?, ?)", ['Prepare invoice for Vikram Mehta', 'medium', 'completed', 2, '2026-07-04']);
    await run("INSERT INTO tasks (title, priority, status, assignedTo, dueDate) VALUES (?, ?, ?, ?, ?)", ['Review social media reports', 'low', 'pending', 1, '2026-07-10']);

    // Seed Settings
    const initialNotifications = JSON.stringify({ newLead: true, followUpReminder: true, taskReminder: true });
    await run("INSERT INTO settings (companyName, emailSettings, smsSettings, notifications) VALUES (?, ?, ?, ?)", ['Digital Flow Agencies', 'smtp.gmail.com', 'Twilio Gateway Service', initialNotifications]);
    
    console.log("🌱 Database seeding complete!");
  }
}

// Call database async initialization
initializeDb().catch(err => {
  console.error("❌ Failed to initialize database schemas and seed data", err);
});

module.exports = {
  run: queryWrappers.run,
  get: queryWrappers.get,
  all: queryWrappers.all
};
