# Deployment Guide for Ionia Next

This guide outlines the steps to deploy both the frontend and backend components of the Ionia Next application.

## Prerequisites

- Node.js (v16 or higher)
- MongoDB instance (local or cloud-based like MongoDB Atlas)
- Cloudinary account (for image storage)

## Environment Setup

### Backend Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```
PORT=8000
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=https://your-frontend-domain.com
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Frontend Environment Variables

Create a `.env.local` file in the `frontend` directory with the following variables:

```
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api/v1
```

## Deployment Steps

### Backend Deployment

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

For production deployment, consider using PM2 or similar process manager:
```
npm install -g pm2
pm2 start src/index.js --name ionia-backend
```

### Frontend Deployment

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build the application:
   ```
   npm run build
   ```

4. Start the production server:
   ```
   npm start
   ```

## Deployment Options

### Option 1: Traditional Hosting

Host the backend on a VPS or dedicated server with Node.js installed, and the frontend on a static hosting service or the same server.

### Option 2: Platform as a Service (PaaS)

- Deploy the backend to platforms like Heroku, Render, or Railway
- Deploy the frontend to Vercel, Netlify, or similar platforms

### Option 3: Containerization

1. Create Dockerfiles for both frontend and backend
2. Build Docker images
3. Deploy using Docker Compose or Kubernetes

## Database Setup

Ensure your MongoDB instance is properly configured with authentication.

Initial admin user creation:
```javascript
// Use this script to create an admin user
db.users.insertOne({
  fullName: "Admin User",
  email: "admin@example.com",
  username: "admin",
  password: "<hashed_password>", // Use bcrypt to hash the password
  role: "admin"
})
```

## Post-Deployment Verification

1. Test user registration and login
2. Verify question creation and management
3. Check test-taking functionality
4. Ensure analytics are displaying correctly

## Troubleshooting

- Check logs for error messages
- Verify environment variables are correctly set
- Ensure database connection is working
- Check for CORS issues between frontend and backend

## Maintenance

- Regularly backup the database
- Update dependencies periodically
- Monitor server performance
- Set up health checks for proactive monitoring 