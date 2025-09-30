# Skillyme Deployment Guide

## Overview
This guide covers deploying the Skillyme application to production:
- **Frontend (Main App)**: Vercel
- **Frontend (Admin Dashboard)**: Vercel (separate deployment)
- **Backend API**: Render
- **Database**: Render (MySQL)

## Prerequisites
1. GitHub repository with your code
2. Vercel account
3. Render account
4. Gmail account for email service

## Step 1: Create Database on Render

### 1.1 Create MySQL Database
1. **Login to Render Dashboard**
2. **Click "New +"** → **"PostgreSQL"** (or MySQL if available)
3. **Configure Database**:
   - **Name**: `skillyme-database`
   - **Database**: `skillyme_production`
   - **User**: `skillyme_user`
   - **Region**: Choose closest to your users
   - **Plan**: Start with Free tier (upgrade as needed)

### 1.2 Get Database Connection Details
After creation, Render will provide:
- **Internal Database URL**: `postgresql://user:password@host:port/database`
- **External Database URL**: For external connections
- **Database Host, Port, User, Password, Database Name**

## Step 2: Deploy Backend to Render

### 2.1 Create Web Service
1. **Click "New +"** → **"Web Service"**
2. **Connect GitHub Repository**
3. **Configure Service**:
   - **Name**: `skillyme-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Node Version**: 18.x or 20.x

### 2.2 Environment Variables
Set these in your Render web service:

```
# Database Configuration (Use Render's internal database URL)
DB_HOST=your-render-db-host
DB_USER=your-render-db-user
DB_PASSWORD=your-render-db-password
DB_NAME=skillyme_production
DB_PORT=5432

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-for-production

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# Application URLs (Update after frontend deployment)
FRONTEND_URL=https://your-frontend-domain.vercel.app
ADMIN_URL=https://your-admin-domain.vercel.app
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app,https://your-admin-domain.vercel.app

# Server Configuration
PORT=10000
NODE_ENV=production

# Security
BCRYPT_ROUNDS=12
```

### 2.3 Deploy
1. **Click "Create Web Service"**
2. **Wait for deployment** (5-10 minutes)
3. **Note the service URL** (e.g., `https://skillyme-backend.onrender.com`)

## Step 3: Prepare Frontend for Vercel

### 3.1 Main App Environment Variables
Create `.env.local` in the root directory:

```
VITE_API_URL=https://your-backend-domain.onrender.com/api
```

### 3.2 Admin App Environment Variables
Create `.env.local` in the `Skillyme_Admin` directory:

```
VITE_API_URL=https://your-backend-domain.onrender.com/api
```

## Step 4: Deploy Frontend to Vercel

### 4.1 Deploy Main App
1. Connect repository to Vercel
2. Set root directory to project root
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variable: `VITE_API_URL`

### 4.2 Deploy Admin Dashboard
1. Create separate Vercel project
2. Set root directory to `Skillyme_Admin`
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variable: `VITE_API_URL`

## Step 5: Update URLs

After deployment, update the environment variables with the actual URLs:

### Backend (Render)
Update these variables in Render dashboard:
- `FRONTEND_URL`: Your main app Vercel URL
- `ADMIN_URL`: Your admin app Vercel URL
- `ALLOWED_ORIGINS`: Both URLs separated by comma

### Frontend (Vercel)
Update these variables in Vercel dashboard:
- `VITE_API_URL`: Your Render backend URL + `/api`

## Step 6: Database Setup

1. Create production MySQL database
2. Run the database migrations:
   ```bash
   cd backend
   node database_migrations/create_users_table.js
   node database_migrations/create_sessions_table.js
   node database_migrations/create_payments_table.js
   node database_migrations/create_admins_table.js
   node database_migrations/create_user_sessions_table.js
   node database_migrations/create_password_resets_table.js
   node database_migrations/create_secure_access_table.js
   ```

3. Insert admin user:
   ```bash
   node database_migrations/insert_admin_user.js
   ```

4. Insert sample session:
   ```bash
   node database_migrations/insert_sample_session.js
   ```

## Step 7: Test Production Deployment

1. Test main app functionality
2. Test admin dashboard access
3. Test payment submission
4. Test email notifications
5. Test authentication flows

## Security Checklist

- [ ] All environment variables are set
- [ ] Database is secured
- [ ] HTTPS is enabled
- [ ] CORS is properly configured
- [ ] Rate limiting is active
- [ ] CSRF protection is enabled
- [ ] Admin credentials are secure

## Troubleshooting

### Common Issues:
1. **CORS errors**: Check ALLOWED_ORIGINS in backend
2. **Database connection**: Verify DB credentials
3. **Email not sending**: Check Gmail app password
4. **Authentication issues**: Verify JWT_SECRET

### Logs:
- **Render**: Check service logs in Render dashboard
- **Vercel**: Check function logs in Vercel dashboard

## Monitoring

Set up monitoring for:
- Database performance
- API response times
- Error rates
- User authentication
- Payment processing

## Backup Strategy

1. Regular database backups
2. Code repository backups
3. Environment variable backups
4. SSL certificate monitoring
