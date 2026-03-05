# Email Verification Setup Guide

## Overview
The app now supports:
- ✅ Admin account creation with email verification
- ✅ Only 1 admin account allowed
- ✅ Admin can change email and password
- ✅ Email verification codes sent via Gmail

## Setup Instructions

### 1. Enable Gmail App Password

To send verification emails, you need to:

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Select "Mail" and "Windows Computer" (or your device)
5. Google will generate a 16-character app password
6. Copy this password

### 2. Update .env.local

Add your Gmail credentials:

```env
GMAIL_EMAIL="your-email@gmail.com"
GMAIL_PASSWORD="your-16-character-app-password"
```

**Important:** Use your Gmail **app password**, NOT your regular Gmail password!

### 3. Test the Setup

1. Restart the dev server: `npm run dev`
2. Go to http://localhost:3000/signup
3. Create the admin account
4. You should receive a verification email
5. Enter the 6-digit code to verify

## Features

### Admin Signup
- Navigate to `/signup` 
- Create admin account with name, email, and password
- Receive verification code via Gmail
- Only 1 admin account is allowed in the system

### Admin Settings
- Click your profile → Settings
- **Change Email**: Update email with verification code
- **Change Password**: Update password with current password verification

## API Endpoints

- `POST /api/auth/signup` - Create admin account
- `POST /api/auth/verify-email` - Verify email with code
- `POST /api/admin/update-profile` - Change email/password

## Environment Variables

```env
# Required for email verification
GMAIL_EMAIL=your-gmail@gmail.com
GMAIL_PASSWORD=your-16-char-app-password

# Required for authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Database
MONGODB_URI=your-mongodb-uri

# OAuth (Optional)
GOOGLE_ID=your-google-id
GOOGLE_SECRET=your-google-secret
```

## Troubleshooting

### Email not sending?
- Verify Gmail credentials in .env.local
- Check 2-Step Verification is enabled
- Make sure you're using app password, not regular password
- Check server logs for errors

### Verification code expired?
- Codes expire after 10 minutes
- Request a new code by creating the account again

### Can't create account?
- Check if admin already exists (only 1 allowed)
- Verify email format is valid
- Check MongoDB connection

---

**Note:** Include .env.local in .gitignore to avoid exposing credentials!
