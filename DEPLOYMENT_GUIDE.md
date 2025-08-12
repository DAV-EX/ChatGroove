# ChatGroove Deployment Guide

Your ChatGroove app is ready to deploy to **Heroku, Render, and Fly.io** as-is! Here are the step-by-step instructions for each platform.

## Prerequisites

All platforms require these environment variables:
- `MONGODB_URI` - Your MongoDB Atlas connection string
- `JWT_SECRET` - A secure random string for JWT tokens
- `GOOGLE_CLIENT_ID` - Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth client secret

## Heroku Deployment

### Step 1: Install Heroku CLI
```bash
# Install via npm
npm install -g heroku

# Login to Heroku
heroku login
```

### Step 2: Create and Deploy
```bash
# Create Heroku app
heroku create your-chatgroove-app

# Set environment variables
heroku config:set MONGODB_URI="your_mongodb_connection_string"
heroku config:set JWT_SECRET="your_jwt_secret_key"
heroku config:set GOOGLE_CLIENT_ID="your_google_client_id"
heroku config:set GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Deploy
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### Step 3: Open your app
```bash
heroku open
```

## Render Deployment

### Step 1: Connect to Render
1. Go to [render.com](https://render.com) and sign up
2. Connect your GitHub repository
3. Create a new "Web Service"

### Step 2: Configure Service
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`
- **Environment**: `Node`
- **Plan**: Free or Starter

### Step 3: Add Environment Variables
In Render dashboard, add:
- `MONGODB_URI` = your MongoDB connection string
- `JWT_SECRET` = your JWT secret
- `GOOGLE_CLIENT_ID` = your Google client ID  
- `GOOGLE_CLIENT_SECRET` = your Google client secret
- `NODE_ENV` = production

### Step 4: Deploy
Click "Create Web Service" and Render will automatically deploy!

## Fly.io Deployment

### Step 1: Install Fly CLI
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login to Fly
fly auth login
```

### Step 2: Launch App
```bash
# Launch (this uses the included fly.toml config)
fly launch

# Set secrets
fly secrets set MONGODB_URI="your_mongodb_connection_string"
fly secrets set JWT_SECRET="your_jwt_secret_key"  
fly secrets set GOOGLE_CLIENT_ID="your_google_client_id"
fly secrets set GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

### Step 3: Deploy
```bash
fly deploy
```

### Step 4: Open your app
```bash
fly open
```

## Database Setup (Required for all platforms)

### MongoDB Atlas (Free Tier Available)
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get your connection string
4. Whitelist `0.0.0.0/0` for all IP addresses (or use specific platform IPs)

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable Google+ API
3. Create OAuth 2.0 credentials
4. Add your deployment URLs to authorized origins

## Platform Comparison

| Platform | Cost | Auto-scaling | Ease | Build Time |
|----------|------|-------------|------|------------|
| **Heroku** | $7/month | Yes | Easy | ~2-3 mins |
| **Render** | Free tier | Yes | Easiest | ~3-4 mins |
| **Fly.io** | Pay-per-use | Yes | Medium | ~1-2 mins |

## Your App Features After Deployment

✅ **Real-time messaging** - Works on all platforms
✅ **Google OAuth login** - Fully functional
✅ **Global chat rooms** - Auto-populated
✅ **Group creation** - Complete functionality  
✅ **MongoDB integration** - Production ready
✅ **Admin dashboard** - Full access control
✅ **Responsive design** - Mobile & desktop
✅ **Dark/Light themes** - User preferences

## Troubleshooting

### Common Issues:
1. **Build fails**: Check Node.js version compatibility
2. **Database connection**: Verify MongoDB URI and IP whitelist
3. **OAuth redirect**: Update Google OAuth settings with new domain
4. **Environment variables**: Double-check all required variables are set

### Logs Access:
- **Heroku**: `heroku logs --tail`
- **Render**: View logs in dashboard
- **Fly.io**: `fly logs`

Your ChatGroove app is production-ready and can be deployed to any of these platforms in under 10 minutes!