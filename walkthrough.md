# Project Walkthrough - Enterprise CRM & Admin Panel (SQLite Edition)

We have successfully migrated your database from a plain JSON file to a **real SQLite relational database** (`database.sqlite`)!

---

## 📂 Project Structure (D Drive)

```text
D:\crm-admin-panel\
│
├── backend/                       # Express Node.js Backend (SQLite database)
│   ├── src/
│   │   ├── db.js                  # SQLite database manager (schema table creation & seeding)
│   │   └── index.js               # Express API endpoints executing SQL queries
│   ├── database.sqlite            # Real SQLite Database File (auto-generated)
│   └── package.json               # Node dependencies (sqlite3, express, bcryptjs, jwt)
│
└── frontend/                      # Angular 19 Application (Standalone Components)
    ├── src/
    │   ├── app/
    │   │   ├── auth/              # Login portal with Signals state management
    │   │   ├── core/              # HTTP intercepter, dark/light theme service
    │   │   ├── layouts/           # Sidebar dashboard layout
    │   │   ├── dashboard/         # Visual statistics cards & Chart.js analytics
    │   │   ├── leads/             # Compact mockup Kanban Board (with blue buttons/badge)
    │   │   ├── customers/         # Customers table & detailed profile modal
    │   │   ├── tasks/             # Tasks assigned lists & filters
    │   │   └── settings/          # System configuration toggles
    └── package.json
```

---

## 🚀 How to Run the Project (Restart Backend)

To load the new SQLite database system:

### 1. Restart the Express Backend
If you have a terminal running the backend on port 3000:
1. Press **`Ctrl + C`** inside that terminal window to stop the old server.
2. Start it again with:
   ```bash
   cd D:\crm-admin-panel\backend
   npm start
   ```
*   *Note: On first startup, the terminal will log: `🌱 SQLite database is empty. Seeding initial crm data...` and create `database.sqlite` automatically!*

### 2. Start the Frontend (Angular)
In your second terminal window:
```bash
cd D:\crm-admin-panel\frontend
npx ng serve
```

---

## 🔑 Demo Access Credentials

| Role Name | Username Email | Password | Allowed Modules |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin&#64;crm.com` | `admin123` | **All Modules** (Full DB control) |
| **Manager** | `manager&#64;crm.com` | `manager123` | Dashboard, Leads, Customers, Tasks, Employees, Reports |
| **Sales Employee** | `employee&#64;crm.com` | `employee123` | Dashboard, Leads (Own only), Tasks (Own only), Settings (View Profile) |
