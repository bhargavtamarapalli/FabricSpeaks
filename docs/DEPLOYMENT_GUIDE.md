# Deployment Guide

## 🚀 Overview
This guide details the steps to deploy the Fabric Speaks application to a production environment.

## 📋 Prerequisites
- **Node.js**: v20.x or later
- **PostgreSQL**: v15.x or later (Supabase recommended)
- **Redis**: v7.x or later
- **Environment Variables**: All secrets from `.env.example` must be available.

## 🛠️ Build & Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Application
```bash
npm run build
```
This command compiles the frontend (Vite) and backend (esbuild) into the `dist/` directory.

### 3. Database Migration
```bash
npm run db:push
# OR if using migrations
npm run migrate:phase5
npm run migrate:phase6
```

### 4. Start Server
```bash
npm run start
```
The server will start on `PORT` (default 5000).

## ☁️ Cloud Deployment (Example: Render/Heroku)

### Build Command
```bash
npm install && npm run build
```

### Start Command
```bash
npm run start
```

### Environment Variables
Ensure the following are set in your cloud provider's dashboard:
- `DATABASE_URL`
- `SESSION_SECRET`
- `REDIS_URL`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`
- `SENTRY_DSN`

## 🔄 Rollback Plan
If a deployment fails:
1. Revert to the previous git commit.
2. Run `npm install` and `npm run build`.
3. Restart the service.
4. If database migrations broke compatibility, restore from the latest backup.

## 🔍 Verification
After deployment, verify:
1. Homepage loads (`/`)
2. API responds (`/api/products`)
3. Sitemap exists (`/sitemap.xml`)
4. Login works
