import { NextRequest, NextResponse } from 'next/server';

/**
 * Email Verification API Endpoint
 * 
 * Handles:
 * 1. Sending verification emails to new users
 * 2. Verifying email with token
 * 3. Resending verification emails
 */

// In-memory store for verification tokens (use database in production)
const verificationTokens = new Map<string, {
  email: string;
  userId: number;
  createdAt: number;
  expiresAt: number;
}>();

// Temporary storage for unverified users (use database in production)
const unverifiedUsers = new Map<string, {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  verificationToken: string;
}>();

/**
 * Generate a random verification token
 */
function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Send verification email (simulated - logs to console in demo mode)
 */
async function sendVerificationEmail(email: string, token: string, userName: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  const emailContent = {
    to: email,
    subject: '✉️ Verify Your Email - HR System',
    userName: userName,
    verificationUrl: verificationUrl,
    tokenExpiry: '24 hours',
    timestamp: new Date().toISOString(),
  };

  console.log('📧 [EMAIL VERIFICATION] Email would be sent:');
  console.log(JSON.stringify(emailContent, null, 2));
  console.log('\n✓ Verification link: ' + verificationUrl + '\n');

  // In production, integrate with Gmail/SendGrid/Resend:
  // await sendViaGmail(email, 'Verify Email', generateVerificationEmailHTML(verificationUrl));
}

/**
 * Handle POST requests
 */
export async function POST(req: NextRequest) {
  try {
    const { action, email, token, firstName, lastName, password } = await req.json();

    if (action === 'send-verification') {
      // Send verification email to new user
      if (!email || !firstName || !lastName) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Generate verification token
      const verificationToken = generateToken();
      const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

      // Store unverified user data
      unverifiedUsers.set(email, {
        email,
        firstName,
        lastName,
        password,
        verificationToken,
      });

      // Store verification token
      verificationTokens.set(verificationToken, {
        email,
        userId: 0, // Will be assigned after verification
        createdAt: Date.now(),
        expiresAt: expiresAt,
      });

      // Send verification email
      await sendVerificationEmail(email, verificationToken, `${firstName} ${lastName}`);

      return NextResponse.json(
        {
          success: true,
          message: 'Verification email sent',
          details: {
            email: email,
            expiresIn: '24 hours',
            action: 'Check your email for verification link',
          },
        },
        { status: 200 }
      );
    }

    if (action === 'verify-token') {
      // Verify email with token
      if (!token) {
        return NextResponse.json(
          { error: 'Verification token required' },
          { status: 400 }
        );
      }

      const tokenData = verificationTokens.get(token);
      
      if (!tokenData) {
        return NextResponse.json(
          { error: 'Invalid or expired verification token' },
          { status: 400 }
        );
      }

      // Check if token is expired
      if (Date.now() > tokenData.expiresAt) {
        verificationTokens.delete(token);
        return NextResponse.json(
          { error: 'Verification token has expired' },
          { status: 400 }
        );
      }

      // Get unverified user data
      const userData = unverifiedUsers.get(tokenData.email);
      if (!userData) {
        return NextResponse.json(
          { error: 'User data not found' },
          { status: 400 }
        );
      }

      // Create verified user (simulate DB update)
      const newUserId = Math.floor(Math.random() * 10000) + 100;
      const verifiedUser = {
        id: newUserId,
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: 'employee',
        emailVerified: true,
      };

      // Clean up
      unverifiedUsers.delete(tokenData.email);
      verificationTokens.delete(token);

      return NextResponse.json(
        {
          success: true,
          message: 'Email verified successfully',
          user: verifiedUser,
          shouldAutoLogin: true,
        },
        { status: 200 }
      );
    }

    if (action === 'resend-verification') {
      // Resend verification email
      if (!email) {
        return NextResponse.json(
          { error: 'Email required' },
          { status: 400 }
        );
      }

      const userData = unverifiedUsers.get(email);
      if (!userData) {
        return NextResponse.json(
          { error: 'No pending verification for this email' },
          { status: 400 }
        );
      }

      // Generate new token
      const newToken = generateToken();
      const expiresAt = Date.now() + (24 * 60 * 60 * 1000);

      // Remove old tokens
      for (const [key, value] of verificationTokens.entries()) {
        if (value.email === email) {
          verificationTokens.delete(key);
        }
      }

      // Store new token
      verificationTokens.set(newToken, {
        email,
        userId: 0,
        createdAt: Date.now(),
        expiresAt: expiresAt,
      });

      // Send new verification email
      await sendVerificationEmail(email, newToken, `${userData.firstName} ${userData.lastName}`);

      return NextResponse.json(
        {
          success: true,
          message: 'Verification email resent',
          details: {
            email: email,
            expiresIn: '24 hours',
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Email verification failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Generate HTML for verification email
 */
function generateVerificationEmailHTML(verificationUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; }
    .header { background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>✉️ Verify Your Email</h2>
    </div>
    <div class="content">
      <p>Thank you for signing up for HR System!</p>
      <p>Please verify your email address by clicking the button below to complete your registration.</p>
      
      <a href="${verificationUrl}" class="button">Verify Email Address</a>
      
      <p style="color: #6b7280; font-size: 14px;">
        Or copy this link in your browser:<br>
        <code style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${verificationUrl}</code>
      </p>
      
      <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
        This link will expire in 24 hours.
      </p>
      
      <div class="footer">
        <p style="margin: 0;">If you didn't create this account, please ignore this email.</p>
        <p style="margin: 5px 0 0 0;">© HR System. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
