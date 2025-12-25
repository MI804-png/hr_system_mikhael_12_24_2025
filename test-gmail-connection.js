#!/usr/bin/env node

/**
 * Gmail SMTP Connection Test
 * 
 * Usage: node test-gmail-connection.js
 * 
 * This script verifies that:
 * 1. Environment variables are set correctly
 * 2. Gmail SMTP connection can be established
 * 3. Credentials are valid
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

console.log('🔧 Gmail SMTP Connection Test\n');
console.log('='.repeat(50));

// Check for .env.local
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('\n❌ .env.local file not found!');
  console.log(`   Path: ${envPath}`);
  console.log('\n   Create .env.local with:');
  console.log('   EMAIL_USER=your-email@gmail.com');
  console.log('   EMAIL_PASSWORD=your-app-password\n');
  process.exit(1);
}

// Check environment variables
console.log('\n📋 Checking environment variables...\n');

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;
const emailFromName = process.env.EMAIL_FROM_NAME || 'HR System Admin';
const smtpHost = process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com';
const smtpPort = process.env.EMAIL_SMTP_PORT || '587';

console.log(`✓ EMAIL_USER: ${emailUser ? '✓ Set (' + emailUser + ')' : '❌ NOT SET'}`);
console.log(`✓ EMAIL_PASSWORD: ${emailPassword ? '✓ Set (length: ' + emailPassword.length + ')' : '❌ NOT SET'}`);
console.log(`✓ EMAIL_FROM_NAME: ${emailFromName}`);
console.log(`✓ EMAIL_SMTP_HOST: ${smtpHost}`);
console.log(`✓ EMAIL_SMTP_PORT: ${smtpPort}`);

if (!emailUser || !emailPassword) {
  console.log('\n❌ Missing required environment variables!');
  console.log('   Set EMAIL_USER and EMAIL_PASSWORD in .env.local\n');
  process.exit(1);
}

// Test nodemailer
console.log('\n🧪 Testing Gmail SMTP Connection...\n');

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: parseInt(smtpPort),
  secure: false, // true for 465, false for other ports
  auth: {
    user: emailUser,
    pass: emailPassword,
  },
  logger: false, // Set to true for verbose logging
  debug: false, // Set to true for debug info
});

// Verify connection
console.log('Connecting to Gmail SMTP server...\n');

transporter.verify((error, success) => {
  console.log('='.repeat(50));

  if (error) {
    console.log('\n❌ Connection Failed!\n');
    console.log('Error:', error.message);

    // Provide helpful suggestions
    if (error.message.includes('Invalid login credentials')) {
      console.log('\n💡 Suggestions:');
      console.log('   • Verify 2-Factor Authentication is enabled');
      console.log('   • Generate new App Password at: https://myaccount.google.com/apppasswords');
      console.log('   • Remove spaces from App Password');
      console.log('   • Check EMAIL_USER and EMAIL_PASSWORD are correct');
      console.log('   • Try regenerating credentials if older than 30 days');
    } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Suggestions:');
      console.log('   • Check internet connection');
      console.log('   • Verify firewall allows port 587');
      console.log('   • Try port 465 with secure: true');
      console.log('   • Check if ISP blocks SMTP on port 587');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Suggestions:');
      console.log('   • Verify SMTP host: ' + smtpHost);
      console.log('   • Check DNS resolution');
      console.log('   • Verify internet connection');
    }

    console.log('\n📖 For help, see: GOOGLE_EMAIL_VERIFICATION.md\n');
    process.exit(1);
  } else {
    console.log('\n✅ Connection Successful!\n');
    console.log('Gmail SMTP is configured correctly.');
    console.log('You can now send emails from the HR System.\n');

    // Send test email option
    console.log('='.repeat(50));
    console.log('\n💌 Ready to send test email?\n');
    console.log('Add this code to send a test email:\n');
    console.log('const testEmail = await transporter.sendMail({');
    console.log(`  from: "'${emailFromName}' <${emailUser}>",`);
    console.log("  to: 'recipient@example.com',");
    console.log("  subject: 'Test Email from HR System',");
    console.log("  html: '<h1>Success!</h1><p>Gmail SMTP is working!</p>'");
    console.log('});\n');

    console.log('='.repeat(50));
    console.log('\n✅ Test Complete!\n');
    console.log('Status: READY FOR PRODUCTION\n');

    process.exit(0);
  }
});

// Handle timeout
setTimeout(() => {
  console.log('\n⏱️  Connection test timeout (30 seconds)\n');
  process.exit(1);
}, 30000);
