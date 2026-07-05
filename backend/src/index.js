const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'super_secret_crm_jwt_token_key_2026';

// Middlewares
app.use(cors());
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No Token Provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Access Denied: Invalid Token' });
    }
    req.user = decoded;
    next();
  });
}

// -------------------------------------------------------------
// AUTH ENDPOINTS
// -------------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await db.get("SELECT * FROM users WHERE LOWER(email) = ?", [email.toLowerCase()]);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials: user not found' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials: password incorrect' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------------------------------------------
// LEADS CRUD API
// -------------------------------------------------------------
app.get('/api/leads', authenticateToken, async (req, res) => {
  try {
    let leads;
    if (req.user.role === 'employee') {
      leads = await db.all("SELECT * FROM leads WHERE assignedTo = ?", [req.user.id]);
    } else {
      leads = await db.all("SELECT * FROM leads");
    }
    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/leads', authenticateToken, async (req, res) => {
  const { name, company, email, phone, status, followUpDate, assignedTo, notes } = req.body;
  try {
    const result = await db.run(
      "INSERT INTO leads (name, company, email, phone, status, followUpDate, assignedTo, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [name, company, email, phone, status, followUpDate, assignedTo, notes]
    );
    res.status(201).json({ id: result.id, ...req.body });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/leads/:id', authenticateToken, async (req, res) => {
  const { name, company, email, phone, status, followUpDate, assignedTo, notes } = req.body;
  try {
    const lead = await db.get("SELECT * FROM leads WHERE id = ?", [req.params.id]);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    await db.run(
      `UPDATE leads SET 
        name = ?, company = ?, email = ?, phone = ?, status = ?, 
        followUpDate = ?, assignedTo = ?, notes = ? 
      WHERE id = ?`,
      [
        name !== undefined ? name : lead.name,
        company !== undefined ? company : lead.company,
        email !== undefined ? email : lead.email,
        phone !== undefined ? phone : lead.phone,
        status !== undefined ? status : lead.status,
        followUpDate !== undefined ? followUpDate : lead.followUpDate,
        assignedTo !== undefined ? assignedTo : lead.assignedTo,
        notes !== undefined ? notes : lead.notes,
        req.params.id
      ]
    );

    const updated = await db.get("SELECT * FROM leads WHERE id = ?", [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/leads/:id', authenticateToken, async (req, res) => {
  try {
    await db.run("DELETE FROM leads WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------------------------------------------
// CUSTOMERS CRUD API
// -------------------------------------------------------------
app.get('/api/customers', authenticateToken, async (req, res) => {
  try {
    const customers = await db.all("SELECT * FROM customers");
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/customers', authenticateToken, async (req, res) => {
  const { name, company, email, phone, address, history } = req.body;
  try {
    const result = await db.run(
      "INSERT INTO customers (name, company, email, phone, address, history) VALUES (?, ?, ?, ?, ?, ?)",
      [name, company, email, phone, address, history]
    );
    res.status(201).json({ id: result.id, ...req.body });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/customers/:id', authenticateToken, async (req, res) => {
  const { name, company, email, phone, address, history } = req.body;
  try {
    const customer = await db.get("SELECT * FROM customers WHERE id = ?", [req.params.id]);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    await db.run(
      `UPDATE customers SET 
        name = ?, company = ?, email = ?, phone = ?, address = ?, history = ? 
      WHERE id = ?`,
      [
        name !== undefined ? name : customer.name,
        company !== undefined ? company : customer.company,
        email !== undefined ? email : customer.email,
        phone !== undefined ? phone : customer.phone,
        address !== undefined ? address : customer.address,
        history !== undefined ? history : customer.history,
        req.params.id
      ]
    );

    const updated = await db.get("SELECT * FROM customers WHERE id = ?", [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    await db.run("DELETE FROM customers WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------------------------------------------
// TASKS CRUD API
// -------------------------------------------------------------
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'employee') {
      tasks = await db.all("SELECT * FROM tasks WHERE assignedTo = ?", [req.user.id]);
    } else {
      tasks = await db.all("SELECT * FROM tasks");
    }
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  const { title, priority, status, assignedTo, dueDate } = req.body;
  try {
    const result = await db.run(
      "INSERT INTO tasks (title, priority, status, assignedTo, dueDate) VALUES (?, ?, ?, ?, ?)",
      [title, priority, status, assignedTo, dueDate]
    );
    res.status(201).json({ id: result.id, ...req.body });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  const { title, priority, status, assignedTo, dueDate } = req.body;
  try {
    const task = await db.get("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    await db.run(
      `UPDATE tasks SET 
        title = ?, priority = ?, status = ?, assignedTo = ?, dueDate = ? 
      WHERE id = ?`,
      [
        title !== undefined ? title : task.title,
        priority !== undefined ? priority : task.priority,
        status !== undefined ? status : task.status,
        assignedTo !== undefined ? assignedTo : task.assignedTo,
        dueDate !== undefined ? dueDate : task.dueDate,
        req.params.id
      ]
    );

    const updated = await db.get("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    await db.run("DELETE FROM tasks WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------------------------------------------
// EMPLOYEES CRUD API
// -------------------------------------------------------------
app.get('/api/employees', authenticateToken, async (req, res) => {
  if (req.user.role === 'employee') {
    return res.status(403).json({ message: 'Forbidden: Insufficient Permissions' });
  }
  try {
    const employees = await db.all("SELECT * FROM employees");
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/employees', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admin only action' });
  }
  const { name, email, role, department, performance } = req.body;
  try {
    const result = await db.run(
      "INSERT INTO employees (name, email, role, department, performance) VALUES (?, ?, ?, ?, ?)",
      [name, email, role, department, performance]
    );

    // Auto-create matching User account for the employee
    const salt = bcrypt.genSaltSync(10);
    const defaultPassword = bcrypt.hashSync('employee123', salt);
    await db.run(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, defaultPassword, role || 'employee']
    );

    res.status(201).json({ id: result.id, ...req.body });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/employees/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { name, email, role, department, performance } = req.body;
  try {
    const employee = await db.get("SELECT * FROM employees WHERE id = ?", [req.params.id]);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    await db.run(
      `UPDATE employees SET 
        name = ?, email = ?, role = ?, department = ?, performance = ? 
      WHERE id = ?`,
      [
        name !== undefined ? name : employee.name,
        email !== undefined ? email : employee.email,
        role !== undefined ? role : employee.role,
        department !== undefined ? department : employee.department,
        performance !== undefined ? performance : employee.performance,
        req.params.id
      ]
    );

    const updated = await db.get("SELECT * FROM employees WHERE id = ?", [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/employees/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const employee = await db.get("SELECT * FROM employees WHERE id = ?", [req.params.id]);
    if (employee) {
      // Delete corresponding user
      await db.run("DELETE FROM users WHERE LOWER(email) = ?", [employee.email.toLowerCase()]);
    }
    await db.run("DELETE FROM employees WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------------------------------------------
// USER MANAGEMENT & ROLE ENDPOINTS
// -------------------------------------------------------------
app.get('/api/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const users = await db.all("SELECT id, email, name, role FROM users");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { email, password, name, role } = req.body;
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password || 'user123', salt);
  
  try {
    const result = await db.run(
      "INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
      [email, hashedPassword, name, role || 'employee']
    );
    res.status(201).json({
      id: result.id,
      email,
      name,
      role: role || 'employee'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    await db.run("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/roles', authenticateToken, (req, res) => {
  res.json([
    { id: 'admin', permissions: ['all'] },
    { id: 'manager', permissions: ['customers', 'reports', 'leads', 'tasks'] },
    { id: 'employee', permissions: ['leads_own', 'tasks_own'] }
  ]);
});

// -------------------------------------------------------------
// SETTINGS API
// -------------------------------------------------------------
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const row = await db.get("SELECT * FROM settings LIMIT 1");
    if (row) {
      row.notifications = JSON.parse(row.notifications);
      res.json(row);
    } else {
      res.json({});
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/settings', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admin only' });
  }
  const { companyName, emailSettings, smsSettings, notifications } = req.body;
  try {
    await db.run(
      "UPDATE settings SET companyName = ?, emailSettings = ?, smsSettings = ?, notifications = ? WHERE id = 1",
      [companyName, emailSettings, smsSettings, JSON.stringify(notifications)]
    );
    const updated = await db.get("SELECT * FROM settings LIMIT 1");
    if (updated) {
      updated.notifications = JSON.parse(updated.notifications);
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Express CRM backend server is running on http://localhost:${PORT}`);
});
