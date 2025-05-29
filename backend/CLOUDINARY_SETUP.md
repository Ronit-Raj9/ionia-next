# Cloudinary Setup Guide

## Current Issue
The backend is showing "⚠️ Cloudinary: Error in configuration" because the required environment variables are missing.

## Step 1: Get Your Cloudinary Credentials

1. **Sign up for Cloudinary** (if you haven't already):
   - Go to https://cloudinary.com/
   - Create a free account

2. **Get your credentials**:
   - After logging in, go to your Dashboard
   - You'll see your Account Details section with:
     - Cloud Name
     - API Key  
     - API Secret

## Step 2: Create Environment File

Create a `.env` file in the `backend` directory with the following content:

```bash
# Server Configuration
PORT=4000
NODE_ENV=development

# Database Configuration  
MONGODB_URI=your_mongodb_connection_string

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# JWT Configuration
ACCESS_TOKEN_SECRET=your_super_secret_access_token_key_here_make_it_very_long_and_complex
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key_here_make_it_very_long_and_complex
REFRESH_TOKEN_EXPIRY=7d

# Cloudinary Configuration (REQUIRED)
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name_here
CLOUDINARY_API_KEY=your_actual_api_key_here
CLOUDINARY_API_SECRET=your_actual_api_secret_here

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@yourapp.com
EMAIL_FROM_NAME=Your App Name

# Security
SESSION_SECRET=your_session_secret_key
BCRYPT_ROUNDS=12
```

## Step 3: Replace Placeholders

Replace the following placeholders with your actual Cloudinary credentials:

- `your_actual_cloud_name_here` → Your Cloudinary Cloud Name
- `your_actual_api_key_here` → Your Cloudinary API Key  
- `your_actual_api_secret_here` → Your Cloudinary API Secret

## Step 4: Example Configuration

Here's what the Cloudinary section should look like with real values:

```bash
# Example (replace with your actual values)
CLOUDINARY_CLOUD_NAME=my-app-cloud
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

## Step 5: Restart the Server

After creating/updating the `.env` file:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

## Step 6: Verify Configuration

After restarting, check the health endpoint:

```bash
curl http://localhost:4000/health
```

You should see:
- `"cloudinary": {"status": "healthy", ...}` instead of the error

## Security Notes

1. **Never commit your `.env` file** - it's already in `.gitignore`
2. **Keep your API secret secure** - don't share it publicly
3. **Use different credentials** for development and production

## Troubleshooting

### Common Issues:

1. **"Missing environment variables" error**:
   - Check that `.env` file exists in `backend/` directory
   - Verify all three Cloudinary variables are set
   - Restart the server after changes

2. **"API error" messages**:
   - Double-check your credentials from Cloudinary dashboard
   - Ensure no extra spaces in the values
   - Verify your Cloudinary account is active

3. **Server not reloading environment**:
   - Stop server completely (Ctrl+C)
   - Restart with `npm run dev`

## Test Upload

Once configured, you can test image upload by:
1. Using the user avatar/cover image upload endpoints
2. Creating questions with images
3. Checking the `/health` endpoint shows Cloudinary as healthy

## Production Setup

For production, set these environment variables on your hosting platform:
- Heroku: `heroku config:set CLOUDINARY_CLOUD_NAME=your_value`
- Vercel: Add in project settings
- Railway: Add in project variables
- Other platforms: Check their documentation for environment variables 