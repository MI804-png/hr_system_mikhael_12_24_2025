# 🚀 Gmail SMTP Setup Checklist

Follow these steps to enable email sending in your HR System.

## Step 1: Enable 2-Factor Authentication ✅

- [ ] Go to [myaccount.google.com](https://myaccount.google.com)
- [ ] Click **"Security"** in sidebar
- [ ] Find **"2-Step Verification"**
- [ ] Click **"Get started"** and follow the process
- [ ] Verify 2FA is enabled (green checkmark)

## Step 2: Generate App-Specific Password ✅

- [ ] Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
- [ ] Select **App**: Mail
- [ ] Select **Device**: Windows Computer (or your device)
- [ ] Click **"Generate"**
- [ ] Copy the 16-character password
- [ ] Remove spaces from password

Example: `abcd efgh ijkl mnop` → `abcdefghijklmnop`

## Step 3: Create .env.local File ✅

In `C:\HR_System\Design\hr-frontend\` create `.env.local`:

```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM_NAME=HR System Admin
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
```

**Important**: Never commit this file to git!

## Step 4: Install Dependencies ✅

```bash
cd C:\HR_System\Design\hr-frontend
npm install nodemailer
```

## Step 5: Verify Setup ✅

### Option A: Test in Development

1. Start the dev server: `npm run dev`
2. Log in as admin
3. Go to Attendance Management
4. Select a date with absent employees
5. Click "📧 Send Absence Notification"
6. **Check console output** for email logs

If using Gmail SMTP, you should see:
```
✓ Email sent via Gmail SMTP: {
  messageId: '<...@gmail.com>',
  to: 'admin@company.com',
  absents: 2,
  timestamp: '2025-12-25T...'
}
```

### Option B: Test Gmail Connection

Create `test-gmail.js`:

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Connection failed:', error);
  } else {
    console.log('✓ Gmail SMTP connection successful');
  }
});
```

Run: `node test-gmail.js`

## Step 6: Verify Emails Are Received ✅

- [ ] Check inbox for absence notification email
- [ ] Check spam/junk folder
- [ ] Verify email sender is your Gmail address
- [ ] Verify email contains absent employees list
- [ ] Verify email date and time are correct

## Step 7: Production Deployment ✅

### For Vercel:

1. Go to Project Settings → Environment Variables
2. Add:
   - `EMAIL_USER`
   - `EMAIL_PASSWORD`
   - `EMAIL_FROM_NAME`
3. Deploy

### For Heroku:

```bash
heroku config:set EMAIL_USER=your-email@gmail.com
heroku config:set EMAIL_PASSWORD=your-app-password
heroku config:set EMAIL_FROM_NAME="HR System Admin"
```

### For AWS/Self-hosted:

Set environment variables in your hosting platform's dashboard or deployment configuration.

## Troubleshooting

### ❌ Error: "Invalid login credentials"

**Solutions:**
- Verify Gmail address is correct
- Verify 2-Factor Authentication is enabled
- Regenerate App Password
- Remove spaces from App Password
- Check EMAIL_USER and EMAIL_PASSWORD in .env.local

### ❌ Error: "SMTP connection timeout"

**Solutions:**
- Check firewall allows port 587
- Try port 465 instead (set `secure: true` in config)
- Check internet connection
- Verify SMTP host is `smtp.gmail.com`

### ❌ Error: "SMTP Error: Could not authenticate"

**Solutions:**
- Ensure 2FA is enabled (App Passwords only work with 2FA)
- Regenerate App Password at myaccount.google.com/apppasswords
- Verify you're using the correct Gmail account
- Check for typos in password

### ❌ Email not received

**Solutions:**
- Check your inbox (not just unread)
- Check spam/junk folder
- Verify recipient email address
- Check Gmail activity log at myaccount.google.com/activity
- Check if Gmail is flagging as suspicious

### ❌ nodemailer not found

**Solution:**
```bash
npm install nodemailer
```

### ❌ .env.local not being loaded

**Solutions:**
- Restart dev server: `npm run dev`
- Check .env.local is in correct directory: `C:\HR_System\Design\hr-frontend`
- Verify file has correct format
- Check for typos in variable names

## File Checklist

- [ ] `.env.local` created with credentials
- [ ] `.gitignore` includes `.env.local`
- [ ] `node_modules/nodemailer` installed
- [ ] `app/api/email/send-absence-notification.ts` updated
- [ ] `app/attendance/page.tsx` has send notification button
- [ ] `GOOGLE_EMAIL_VERIFICATION.md` reviewed
- [ ] Test email sent successfully

## Quick Commands

```bash
# Install dependencies
npm install nodemailer

# Start dev server
npm run dev

# Test Gmail connection
node test-gmail.js

# Check environment variables (development)
echo $env:EMAIL_USER
echo $env:EMAIL_PASSWORD

# List installed packages
npm list nodemailer
```

## Support

For more details, see:
- `GOOGLE_EMAIL_VERIFICATION.md` - Complete setup guide
- `EMAIL_NOTIFICATION_SETUP.md` - Email system overview
- `.env.example` - Environment variables template

---

✅ **Status**: Ready for Gmail SMTP setup!

Once complete, absence notifications will be automatically sent to admin when employees don't sign in.
