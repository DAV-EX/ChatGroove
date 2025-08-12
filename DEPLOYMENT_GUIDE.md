# ChatGroove Deployment Guide

## Free Deployment Options

### Option 1: Vercel (Recommended for Frontend + Serverless API)
1. Download project ZIP from Replit
2. Push to GitHub repository
3. Connect GitHub to Vercel
4. Add environment variables in Vercel dashboard
5. Deploy automatically

### Option 2: Railway (Full-Stack with PostgreSQL)
1. Create Railway account (free tier available)
2. Connect GitHub repository
3. Railway auto-detects Node.js and provides PostgreSQL
4. Add environment variables
5. Deploy with one click

### Option 3: Render (Full-Stack Alternative)
1. Create Render account
2. Connect GitHub repository
3. Create PostgreSQL database (free tier)
4. Create web service
5. Add environment variables

## Required Environment Variables
```
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_session_secret_key
REPL_ID=your_app_id
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=your-app-domain.com
```

## Pre-Deployment Checklist
- [ ] Database schema deployed via `npm run db:push`
- [ ] Environment variables configured
- [ ] Build command: `npm run build`
- [ ] Start command: `npm run start` (needs to be added to package.json)

## Files to Include in ZIP
- All source code files
- package.json and package-lock.json
- Database schema files
- Configuration files (vite.config.ts, tailwind.config.ts, etc.)
- README.md with setup instructions

## Post-Deployment Setup
1. Run database migrations
2. Seed global rooms if needed
3. Test authentication flow
4. Verify all features work correctly