import { NextRequest, NextResponse } from 'next/server';

/**
 * Email API Endpoint for Absence Notifications
 * 
 * Supports two modes:
 * 1. Demo Mode (default): Logs email to console
 * 2. Gmail SMTP Mode: Sends via Gmail (requires environment variables)
 * 
 * To enable Gmail SMTP:
 * 1. Set EMAIL_USER in environment
 * 2. Set EMAIL_PASSWORD in environment
 * 3. Install nodemailer: npm install nodemailer
 */

let nodemailer: any = null;

// Try to load nodemailer if available
try {
  nodemailer = require('nodemailer');
} catch (e) {
  console.warn('nodemailer not installed - using demo mode');
}

export async function POST(req: NextRequest) {
  try {
    const { adminEmail, absentEmployees, date } = await req.json();

    // Validate input
    if (!adminEmail || !absentEmployees || !Array.isArray(absentEmployees)) {
      return NextResponse.json(
        { error: 'Missing required fields: adminEmail, absentEmployees, date' },
        { status: 400 }
      );
    }

    if (absentEmployees.length === 0) {
      return NextResponse.json(
        { error: 'No absent employees to notify' },
        { status: 400 }
      );
    }

    const htmlContent = generateEmailHTML(absentEmployees, date);

    // Check if Gmail credentials are configured
    const hasGmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;

    if (hasGmailConfig && nodemailer) {
      // Gmail SMTP Mode
      return await sendViaGmail(adminEmail, absentEmployees, date, htmlContent);
    } else {
      // Demo Mode
      return sendDemoMode(adminEmail, absentEmployees, date, htmlContent);
    }
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error',
        mode: process.env.EMAIL_USER ? 'Gmail SMTP' : 'Demo',
      },
      { status: 500 }
    );
  }
}

/**
 * Send email via Gmail SMTP
 */
async function sendViaGmail(
  adminEmail: string,
  absentEmployees: any[],
  date: string,
  htmlContent: string
) {
  try {
    if (!nodemailer) {
      throw new Error('nodemailer is not installed');
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports like 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Verify connection
    await transporter.verify();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'HR System Admin'}" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `⚠️ Employee Absence Alert - ${date}`,
      html: htmlContent,
      text: generateTextEmail(absentEmployees, date),
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✓ Email sent via Gmail SMTP:', {
      messageId: info.messageId,
      to: adminEmail,
      absents: absentEmployees.length,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Email sent successfully via Gmail SMTP',
        details: {
          to: adminEmail,
          count: absentEmployees.length,
          date: date,
          absents: absentEmployees.map(e => e.name),
          messageId: info.messageId,
          mode: 'Gmail SMTP',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Gmail SMTP Error:', error);

    // Provide helpful error message
    let errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('Invalid login credentials')) {
      errorMessage =
        'Invalid Gmail credentials. Check EMAIL_USER and EMAIL_PASSWORD environment variables.';
    } else if (errorMessage.includes('timeout')) {
      errorMessage = 'Gmail SMTP connection timeout. Check firewall and port settings.';
    }

    return NextResponse.json(
      {
        error: 'Gmail SMTP failed',
        details: errorMessage,
        mode: 'Gmail SMTP',
        solution: 'See GOOGLE_EMAIL_VERIFICATION.md for setup instructions',
      },
      { status: 500 }
    );
  }
}

/**
 * Demo mode - logs email details to console
 * Useful for development without email service
 */
function sendDemoMode(
  adminEmail: string,
  absentEmployees: any[],
  date: string,
  htmlContent: string
) {
  const emailContent = {
    to: adminEmail,
    subject: `⚠️ Employee Absence Alert - ${date}`,
    timestamp: new Date().toISOString(),
    absentEmployees: absentEmployees,
    mode: 'DEMO',
  };

  console.log('📧 [DEMO MODE] Email would be sent:');
  console.log(JSON.stringify(emailContent, null, 2));
  console.log('\n💡 To enable Gmail SMTP:');
  console.log('   1. Set EMAIL_USER environment variable');
  console.log('   2. Set EMAIL_PASSWORD environment variable');
  console.log('   3. Run: npm install nodemailer');
  console.log('   4. See GOOGLE_EMAIL_VERIFICATION.md for complete setup\n');

  return NextResponse.json(
    {
      success: true,
      message: 'Email logged to console (demo mode)',
      details: {
        to: adminEmail,
        count: absentEmployees.length,
        date: date,
        absents: absentEmployees.map(e => e.name),
        mode: 'Demo (no email service configured)',
      },
      warning: 'Gmail credentials not configured. To send real emails, see GOOGLE_EMAIL_VERIFICATION.md',
    },
    { status: 200 }
  );
}

/**
 * Generate HTML email content
 */
function generateEmailHTML(absentEmployees: any[], date: string): string {
  const employeeRows = absentEmployees
    .map(
      emp =>
        `<tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <strong style="color: #1f2937;">${emp.name}</strong>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">
            ${emp.position}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <a href="mailto:${emp.email}" style="color: #3b82f6; text-decoration: none;">
              ${emp.email}
            </a>
          </td>
        </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; }
    .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h2 { margin: 0; font-size: 20px; }
    .content { background-color: white; padding: 20px; border-radius: 0 0 8px 8px; }
    .date { color: #6b7280; font-size: 14px; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    thead { background-color: #f3f4f6; }
    th { padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; }
    .count-badge { display: inline-block; background-color: #dc2626; color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
    .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🚨 Employee Absence Notification</h2>
    </div>
    <div class="content">
      <p style="margin-top: 0;">
        The following employees have <strong>NOT signed in</strong> for:
      </p>
      <div class="date">📅 <strong>${date}</strong></div>
      
      <div class="count-badge">${absentEmployees.length} Absent Employee${absentEmployees.length !== 1 ? 's' : ''}</div>
      
      <table>
        <thead>
          <tr>
            <th>Employee Name</th>
            <th>Position</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          ${employeeRows}
        </tbody>
      </table>
      
      <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #991b1b;">
          <strong>Action Required:</strong> Please follow up with the above employees to confirm their attendance status, check for leave approvals, or any issues preventing them from signing in.
        </p>
      </div>
      
      <div class="footer">
        <p style="margin: 0; color: #6b7280;">
          This is an automated notification from HR System.<br>
          Do not reply to this email. Contact HR for more information.
        </p>
        <p style="margin: 5px 0 0 0; color: #9ca3af;">
          Sent on ${new Date().toLocaleString()}
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate plain text email content
 */
function generateTextEmail(absentEmployees: any[], date: string): string {
  const employeeList = absentEmployees
    .map(emp => `• ${emp.name} (${emp.position}) - ${emp.email}`)
    .join('\n');

  return `
EMPLOYEE ABSENCE NOTIFICATION

The following employees have NOT signed in for: ${date}

${employeeList}

ACTION REQUIRED:
Please follow up with the above employees to confirm their attendance status, check for leave approvals, or any issues preventing them from signing in.

---
This is an automated notification from HR System.
Do not reply to this email. Contact HR for more information.
Sent on ${new Date().toLocaleString()}
  `;
}

