# Full-Stack CRM Hosting Guide

To host this CRM project and share a live link with your clients, you need to host the **Angular Frontend** and the **Node.js Backend** separately (or together on a VPS).

Here are the two best methods to host your full-stack application:

---

## 🚀 Method 1: 100% Free Hosting (Best for Demos & Portfolios)

This is the best way to host a demo to show potential clients without spending any money.

### 1. Angular Frontend -> Host on **Vercel** (Free)
1. Build your Angular application for production:
   ```bash
   cd D:\crm-admin-panel\frontend
   npx ng build
   ```
   *This generates static files in `D:\crm-admin-panel\frontend\dist\frontend\browser`.*
2. Create a free account on [vercel.com](https://vercel.com).
3. Connect your project repository from GitHub to Vercel, select the frontend folder, set build command to `ng build` and directory to `dist/frontend/browser`.
4. Vercel will give you a free live domain link: `https://your-crm.vercel.app`.

### 2. Node.js Backend -> Host on **Render.com** (Free)
1. Create a free account on [render.com](https://render.com).
2. Create a new **Web Service** and connect your backend code GitHub repository.
3. Render will host your Express API server and give you a public API link: `https://your-crm-backend.onrender.com`.
4. *Important Note:* Render's free tier server goes to sleep when idle and has "ephemeral" storage (meaning the SQLite file resets when the server sleeps). For a permanent free database on the cloud, we can connect a free PostgreSQL database from [neon.tech](https://neon.tech) to your Express backend with just 5 lines of code change.

---

## 💼 Method 2: Professional Client Hosting (Best for Paying Clients)

If you are selling this CRM to a paying client, they must buy a server to keep it running 24/7 permanently.

### Virtual Private Server (VPS) -> Host on **Hostinger / DigitalOcean**
This is the industry standard for client applications.

1.  **Buy a VPS:** Help your client buy a Linux VPS (Ubuntu OS) from Hostinger, DigitalOcean, or AWS (costs approx. $4 to $6 per month).
2.  **Install Node.js & PM2:** On the server, install Node.js and a tool called **PM2** to keep your backend server running in the background forever:
    ```bash
    npm install -g pm2
    pm2 start src/index.js --name crm-backend
    ```
3.  **Setup Nginx:** Configure Nginx to serve the Angular `dist` folder on port 80 (HTTP) and reverse proxy API calls to the Express server on port 3000.
4.  **Database Security:** Since the VPS is a persistent virtual machine, your `database.sqlite` file will **never** reset. All customer data, tasks, and settings will stay completely secure and permanent forever.
