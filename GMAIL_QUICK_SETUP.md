# 🚀 Gmail Setup Quick Reference

## 5-Minute Setup

### 1️⃣ Enable 2FA
```
1. Go to myaccount.google.com/security
2. Enable "2-Step Verification"
```

### 2️⃣ Get App Password
```
1. Go to myaccount.google.com/apppasswords
2. Select: Mail + Windows Computer
3. Copy 16-character password
```

### 3️⃣ Create .env.local
**File**: `C:\HR_System\Design\hr-frontend\.env.local`

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-password-here
EMAIL_FROM_NAME=HR System Admin
```

### 4️⃣ Install & Test
```bash
cd C:\HR_System\Design\hr-frontend
npm install nodemailer
node test-gmail-connection.js
npm run dev
```

### 5️⃣ Send Test Email
1. Log in as admin
2. Go to Attendance → Select date
3. Click "Send Absence Notification"
4. Check inbox ✓

---

## Environment Variables Quick View

| Variable | Value | Required |
|----------|-------|----------|
| `EMAIL_USER` | your@gmail.com | ✅ Yes |
| `EMAIL_PASSWORD` | app-password | ✅ Yes |
| `EMAIL_FROM_NAME` | HR System Admin | ⏳ Optional |
| `EMAIL_SMTP_HOST` | smtp.gmail.com | ⏳ Optional |
| `EMAIL_SMTP_PORT` | 587 | ⏳ Optional |

---

## Troubleshooting One-Liners

| Problem | Fix |
|---------|-----|
| "Invalid credentials" | Regenerate App Password at myaccount.google.com/apppasswords |
| ".env.local not loading" | Restart dev server: `npm run dev` |
| "nodemailer not found" | Run `npm install nodemailer` |
| "Connection timeout" | Check firewall, try port 465 |
| "Email not received" | Check spam folder |

---

## Test Commands

```bash
# Test Gmail connection
node test-gmail-connection.js

# Check environment variables (PowerShell)
$env:EMAIL_USER
$env:EMAIL_PASSWORD

# Reinstall nodemailer
npm install nodemailer

# Restart dev server
npm run dev
```

---

## Important Files

| File | Purpose |
|------|---------|
| `.env.local` | Credentials (⚠️ Never commit!) |
| `EMAIL_GMAIL_COMPLETE_SETUP.md` | Full setup guide |
| `GMAIL_SETUP_CHECKLIST.md` | Step-by-step checklist |
| `GOOGLE_EMAIL_VERIFICATION.md` | Complete documentation |
| `test-gmail-connection.js` | Connection tester |

---

## Common Email Responses

### ✅ Success
```json
{
  "success": true,
  "mode": "Gmail SMTP",
  "count": 2
}
```

### ⏳ Demo Mode
```json
{
  "success": true,
  "mode": "Demo",
  "warning": "Gmail credentials not configured"
}
```

### ❌ Error
```json
{
  "error": "Gmail SMTP failed",
  "details": "Invalid login credentials"
}
```

---

## Helpful Links

- 🔐 [Gmail Security](https://myaccount.google.com/security)
- 🔑 [App Passwords](https://myaccount.google.com/apppasswords)
- 📧 [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
- 📚 [Nodemailer Docs](https://nodemailer.com/)

---

## Feature Highlight

When configured, admins receive:

```
📧 Email Subject: ⚠️ Employee Absence Alert - 2025-12-25

📋 Email Body:
   • Employee names
   • Positions
   • Email addresses
   • Date of absence
   • Action-required notice
```

---

## Status

✅ Email system: Ready
✅ Gmail integration: Ready
⏳ Your credentials: Pending setup

**Next**: Follow 5-Minute Setup above!
