# 📧 Employee Absence Email Notification System

## Overview
This feature automatically notifies administrators when employees fail to sign in for their scheduled workday.

## Features

### ✅ Automatic Absence Detection
- Identifies employees with "absent" status or missing sign-in times
- Groups absent employees by date
- Shows real-time count of absent employees

### ✅ Admin Notification Button
- Available only to admin users in the Attendance Management page
- Red "Send Absence Notification" button with count badge
- Only visible when there are absent employees
- Loading state while email is being sent

### ✅ Detailed Email Content
The email notification includes:
- Employee name
- Job position
- Email address
- Date of absence
- Professional HTML formatted email
- Call-to-action to follow up with employees

## How It Works

### Step 1: Admin Views Attendance
1. Admin logs in and goes to **Attendance Management** page
2. Selects a date to view attendance records for that day
3. System automatically identifies absent employees

### Step 2: Trigger Email Notification
1. Admin clicks **"📧 Send Absence Notification"** button
2. Button shows number of absent employees (e.g., "2")
3. Email is sent to admin with absence details

### Step 3: Email Received
Admin receives email with:
- List of absent employees (Name, Position, Email)
- Date of absence
- Instructions to follow up

## Implementation Details

### Files Created
```
app/api/email/send-absence-notification.ts  - Email API endpoint
types/nodemailer.d.ts                       - TypeScript declarations
```

### Files Modified
```
app/attendance/page.tsx  - Added email trigger UI and logic
```

### API Endpoint
**POST** `/api/email/send-absence-notification`

#### Request Body
```json
{
  "adminEmail": "admin@company.com",
  "absentEmployees": [
    {
      "name": "Mike Johnson",
      "position": "HR Manager",
      "email": "mike@company.com"
    },
    {
      "name": "Tom Wilson",
      "position": "UI/UX Designer",
      "email": "tom@company.com"
    }
  ],
  "date": "2025-12-24"
}
```

#### Response
```json
{
  "success": true,
  "message": "Email notification sent successfully",
  "details": {
    "to": "admin@company.com",
    "count": 2,
    "date": "2025-12-24",
    "absents": ["Mike Johnson", "Tom Wilson"]
  }
}
```

## Production Setup

To enable real email sending in production, integrate one of these services:

### Option 1: Gmail SMTP (with nodemailer)
```bash
npm install nodemailer
```

Set environment variables:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
```

### Option 2: Resend (Recommended)
```bash
npm install resend
```

Set environment variable:
```
RESEND_API_KEY=your-resend-api-key
```

### Option 3: SendGrid
```bash
npm install @sendgrid/mail
```

Set environment variable:
```
SENDGRID_API_KEY=your-sendgrid-api-key
```

### Option 4: AWS SES
Configure AWS credentials in environment variables.

## Current State (Demo)
The current implementation:
- ✅ Detects absent employees correctly
- ✅ Shows UI button to send notifications
- ✅ Validates email data
- ✅ **Logs email details to console** (demo mode)
- ⏳ Ready for email service integration

## Usage Instructions

### For Admins:

1. **Navigate to Attendance Page**
   - Click "📍 Attendance Management" in sidebar

2. **Select a Date**
   - Use the date picker to view attendance for specific day

3. **View Absent Employees**
   - Button appears only if there are absent employees
   - Badge shows count of absent employees

4. **Send Notification**
   - Click red "📧 Send Absence Notification" button
   - Confirm action in dialog
   - Button shows "Sending..." while processing
   - Success message with list of notified employees

5. **Success Response**
   ```
   ✓ Email sent successfully!
   
   Notified admin about 2 absent employee(s):
   Mike Johnson, Tom Wilson
   ```

## Error Handling

If email sending fails:
```
❌ Email sending failed: [Error message]

Note: Please configure EMAIL_USER and EMAIL_PASSWORD environment variables.
```

Suggestions:
- Check environment variables are set
- Verify email service credentials
- Check network connectivity
- Review API key validity

## Future Enhancements

1. **Scheduled Email Alerts**
   - Automatic email at end of day
   - Configurable reminder times

2. **Multiple Recipients**
   - Send to multiple admins
   - Send to department heads
   - CC HR managers

3. **Email Templates**
   - Customizable email templates
   - Branding support
   - Multi-language support

4. **Email History**
   - Track sent notifications
   - Archive of sent emails
   - Delivery status

5. **Advanced Filtering**
   - Exclude certain employee types
   - Department-specific alerts
   - Custom absence rules

## Security Considerations

- ✅ API key protection (environment variables)
- ✅ Input validation on email endpoint
- ✅ Admin-only access control
- ✅ Error messages don't expose sensitive data
- ⚠️ Store email credentials securely in production
- ⚠️ Use HTTPS for all email API calls
- ⚠️ Implement rate limiting on email endpoint

## Testing

### Test Absence Notification:

1. Set employee status to "absent" in test data
2. View attendance on that date as admin
3. Click "Send Absence Notification"
4. Check console logs for email content
5. Verify success message appears

### Test with 0 Absent Employees:
- Button should not appear if all employees signed in
- Message: "✓ No absent employees to report"

### Test Error Handling:
- Missing environment variables
- Invalid email format
- Network connectivity issues

## Current Demo State
The feature is fully functional in demo mode:
- ✅ Detects absent employees
- ✅ Shows UI controls
- ✅ Validates input
- ✅ Logs to console
- ⏳ Ready to integrate with real email service

To enable production email, uncomment the email service code in `/app/api/email/send-absence-notification.ts` and add your API credentials.
