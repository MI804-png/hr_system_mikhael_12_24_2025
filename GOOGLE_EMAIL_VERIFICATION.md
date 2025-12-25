# 🔐 Google Email Verification & Gmail SMTP Setup Guide

## Overview
This guide explains how to set up email verification and email sending through Google's Gmail service for the HR System.

---

## Part 1: Gmail SMTP Configuration (Recommended for Production)

### Prerequisites
- Active Gmail account or Google Workspace account
- Admin access to Google Account settings

### Step 1: Enable 2-Factor Authentication (Required)

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click **"Security"** in the left sidebar
3. Find **"2-Step Verification"**
4. Click **"Get started"** and follow the verification process
5. Confirm setup is complete (you'll see a green checkmark)

### Step 2: Generate App-Specific Password

**Only works if 2-Factor Authentication is enabled**

1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select:
   - **App**: Mail
   - **Device**: Windows Computer (or your device)
3. Google will generate a 16-character password
4. **Copy this password** - you'll use it in environment variables

Example generated password: `abcd efgh ijkl mnop` (remove spaces = `abcdefghijklmnop`)

### Step 3: Set Environment Variables

Create or update `.env.local` file in `hr-frontend` directory:

```bash
# Gmail Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM_NAME=HR System Admin

# Optional: For production
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
```

### Step 4: Install Email Dependencies

```bash
cd C:\HR_System\Design\hr-frontend
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### Step 5: Update Email API Endpoint

The API endpoint at `/app/api/email/send-absence-notification.ts` is ready to use with Gmail.

---

## Part 2: Google OAuth Email Verification (Optional)

### Use Case
Allow users to sign up/login using their Google account and verify ownership of email.

### Step 1: Set Up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project:
   - Click **"Select a Project"** dropdown
   - Click **"NEW PROJECT"**
   - Name: `HR System`
   - Click **"Create"**

3. Wait for project creation (2-3 minutes)

### Step 2: Enable Google+ API

1. Search for **"Gmail API"** in the search bar
2. Click **"Enable"**
3. Search for **"Google+ API"**
4. Click **"Enable"**

### Step 3: Create OAuth 2.0 Credentials

1. Go to **"Credentials"** in left sidebar
2. Click **"+ CREATE CREDENTIALS"**
3. Select **"OAuth 2.0 Client ID"**
4. Choose **"Web application"**
5. Add Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/google/callback
   https://yourdomain.com/api/auth/google/callback
   ```
6. Click **"Create"**
7. Copy the generated:
   - Client ID
   - Client Secret

### Step 4: Set Environment Variables for OAuth

Add to `.env.local`:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

---

## Part 3: Email Verification Flow Implementation

### Implementation Plan

#### 1. Update Auth Context for Email Verification

```typescript
// In src/context/AuthContext.tsx
interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role?: string;
  emailVerified?: boolean;
  verificationToken?: string;
}

// Add verification method
const verifyEmail = async (token: string) => {
  // Verify user's email with token
};

const sendVerificationEmail = async (email: string) => {
  // Send verification email
};
```

#### 2. Create Email Verification API

```
app/api/auth/verify-email.ts
app/api/auth/send-verification.ts
```

#### 3. Create Verification Page

```
app/verify-email/page.tsx
```

---

## Part 4: Complete Gmail SMTP Setup Example

### Updated API Endpoint with Gmail Support

Here's how the email sending would work with Gmail:

```typescript
// app/api/email/send-absence-notification.ts

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { adminEmail, absentEmployees, date } = await req.json();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'HR System'}" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `⚠️ Employee Absence Alert - ${date}`,
      html: generateEmailHTML(absentEmployees, date),
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully via Gmail',
    });
  } catch (error) {
    console.error('Gmail SMTP error:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    );
  }
}
```

---

## Part 5: Testing Email Configuration

### Test 1: Verify Gmail SMTP Connection

```bash
# Create test-gmail.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password',
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Connection error:', error);
  } else {
    console.log('✓ Gmail SMTP connection successful');
  }
});
```

Run: `node test-gmail.js`

### Test 2: Send Test Email

```bash
const mailOptions = {
  from: 'your-email@gmail.com',
  to: 'recipient@example.com',
  subject: 'Test Email',
  text: 'This is a test email from Gmail SMTP',
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Send error:', error);
  } else {
    console.log('✓ Email sent:', info.response);
  }
});
```

### Test 3: Test in HR System

1. Log in as admin
2. Go to Attendance Management
3. Select a date with absent employees
4. Click "📧 Send Absence Notification"
5. Check inbox for email

---

## Part 6: Troubleshooting

### Common Issues & Solutions

#### Error: "Invalid login credentials"
- ✓ Verify email address is correct
- ✓ Check 2-Factor Authentication is enabled
- ✓ Regenerate App Password if older than 30 days
- ✓ Remove spaces from App Password

#### Error: "Less secure app access"
- Gmail has deprecated "Less Secure Apps"
- **Use App Passwords instead** (Step 2 above)

#### Error: "SMTP connection timeout"
- Check firewall settings
- Port 587 should be open
- Try port 465 if 587 fails (set `secure: true`)

#### Error: "451 Temporary service unavailable"
- Gmail API rate limit reached
- Wait a few seconds before retrying
- Implement rate limiting in production

#### Email not received
- Check spam/junk folder
- Verify recipient email is correct
- Check Gmail activity log at [myaccount.google.com/activity](https://myaccount.google.com/activity)

---

## Part 7: Security Best Practices

### ✅ Do's
- ✓ Store credentials in `.env.local` (never commit)
- ✓ Use App Passwords, not main account password
- ✓ Enable 2-Factor Authentication
- ✓ Keep credentials secure
- ✓ Use HTTPS in production
- ✓ Rotate App Passwords periodically

### ❌ Don'ts
- ✗ Don't commit `.env.local` to git
- ✗ Don't use main Gmail password
- ✗ Don't share credentials via email/chat
- ✗ Don't expose credentials in error messages
- ✗ Don't allow unlimited email sending (implement rate limiting)

### .gitignore Configuration

```bash
# .gitignore
.env.local
.env.development.local
.env.*.local
```

---

## Part 8: Production Deployment

### Heroku/Vercel Deployment

1. Set environment variables in platform dashboard:
   ```
   EMAIL_USER: your-email@gmail.com
   EMAIL_PASSWORD: your-app-password
   EMAIL_FROM_NAME: HR System
   EMAIL_SMTP_HOST: smtp.gmail.com
   EMAIL_SMTP_PORT: 587
   ```

2. Deploy your application
3. Test email sending in production

### AWS Deployment

Use AWS Systems Manager Parameter Store or Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name hr-system/email \
  --secret-string '{"user":"your-email@gmail.com","password":"your-app-password"}'
```

---

## Part 9: Alternative Email Services

If you prefer not to use Gmail, alternatives:

### SendGrid
```bash
npm install @sendgrid/mail
# Set: SENDGRID_API_KEY
```

### Resend (Recommended for Next.js)
```bash
npm install resend
# Set: RESEND_API_KEY
# Uses your own domain email
```

### Mailgun
```bash
npm install mailgun.js
# Set: MAILGUN_API_KEY and MAILGUN_DOMAIN
```

### AWS SES
```bash
npm install @aws-sdk/client-ses
# Configure AWS credentials
```

---

## Quick Start Checklist

- [ ] Enable 2-Factor Authentication on Gmail
- [ ] Generate App-Specific Password
- [ ] Create `.env.local` with credentials
- [ ] Install nodemailer: `npm install nodemailer`
- [ ] Test Gmail connection
- [ ] Update API endpoint to use Gmail
- [ ] Test in HR System
- [ ] Verify emails are received
- [ ] Add `.env.local` to `.gitignore`
- [ ] Document setup in team wiki

---

## Support & Resources

- [Google Account Security](https://myaccount.google.com/security)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Nodemailer Documentation](https://nodemailer.com/)
- [SMTP Configuration](https://support.google.com/mail/answer/7126229)

---

## Current Implementation Status

✅ Email API endpoint ready
✅ Attendance page UI ready
✅ Logic for detecting absent employees ready
⏳ Waiting for Gmail configuration

**Next Step**: Follow Part 1 (Gmail SMTP Configuration) to enable real email sending!
