// nucash-server/services/emailService.js
// FIXED: Added sendRefundReceipt function for refund emails

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create email transporter (using Gmail - you can change this)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter verification failed:', error.message);
    console.error('   Check EMAIL_USER and EMAIL_PASSWORD in .env file');
    console.error('   For Gmail, you need an App Password (not your regular password)');
    console.error('   Go to: https://myaccount.google.com/apppasswords');
  } else {
    console.log('✅ Email transporter is ready to send emails');
  }
});

/**
 * Send payment receipt email
 */
export const sendReceipt = async (transaction) => {
  const { 
    userEmail, 
    userName, 
    fareAmount, 
    previousBalance, 
    newBalance, 
    timestamp, 
    merchantName, 
    driverName, 
    transactionId 
  } = transaction;

  if (!userEmail) {
    console.log('⚠️ No email for user, skipping receipt');
    return;
  }

  const wentNegative = newBalance < 0;
  const isAtLimit = newBalance <= -14;

  const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { text-align: center; border-bottom: 3px solid #4CAF50; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #4CAF50; margin: 0; }
    .receipt-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
    .label { color: #666; font-weight: 500; }
    .value { color: #333; font-weight: 600; }
    .amount-paid { background: #f0f9f4; padding: 15px; border-radius: 8px; margin-top: 20px; }
    .amount-paid .value { color: #f44336; font-size: 24px; }
    .balance-row { background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 15px; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
    .warning-box { background: #fff3e0; padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #ff9800; }
    .warning-box strong { color: #f57c00; }
    .warning-box p { margin: 5px 0 0 0; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💳 NUCash Receipt</h1>
      <p style="color: #666; margin: 5px 0;">Payment Confirmation</p>
    </div>
    
    <div class="receipt-row">
      <span class="label">Transaction ID:</span>
      <span class="value">${transactionId}</span>
    </div>
    
    <div class="receipt-row">
      <span class="label">Date & Time:</span>
      <span class="value">${new Date(timestamp).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })}</span>
    </div>
    
    <div class="receipt-row">
      <span class="label">Name:</span>
      <span class="value">${userName}</span>
    </div>
    
    ${merchantName ? `
    <div class="receipt-row">
      <span class="label">Merchant:</span>
      <span class="value">${merchantName}</span>
    </div>
    ` : ''}
    
    ${driverName ? `
    <div class="receipt-row">
      <span class="label">Driver:</span>
      <span class="value">${driverName}</span>
    </div>
    ` : ''}
    
    <div class="amount-paid">
      <div class="receipt-row" style="border: none;">
        <span class="label" style="font-size: 18px;">Amount Paid:</span>
        <span class="value">₱${fareAmount.toFixed(2)}</span>
      </div>
    </div>

    <div class="balance-row">
      <div class="receipt-row" style="border: none; margin-bottom: 8px;">
        <span class="label">Previous Balance:</span>
        <span class="value">₱${previousBalance.toFixed(2)}</span>
      </div>
      <div class="receipt-row" style="border: none;">
        <span class="label">New Balance:</span>
        <span class="value" style="color: ${newBalance < 0 ? '#f44336' : '#4CAF50'};">₱${newBalance.toFixed(2)}</span>
      </div>
    </div>
    
    ${wentNegative ? `
    <div class="warning-box">
      <strong>⚠️ Negative Balance Active</strong>
      <p>${isAtLimit 
        ? 'Your balance has reached the limit. Please recharge your NUCash account at the earliest.' 
        : 'Your balance is negative. Please recharge your NUCash account soon to continue using the service.'
      }</p>
    </div>
    ` : ''}
    
    <div class="footer">
      <p>Thank you for using NUCash!</p>
      <p>This is an automated receipt. Please do not reply to this email.</p>
      <p style="margin-top: 10px; color: #aaa;">For balance inquiries, please log on to the NUCash Website.</p>
    </div>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: `"NUCash System" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: `NUCash Receipt - ₱${fareAmount.toFixed(2)} Payment`,
    html: emailContent
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Receipt sent to ${userEmail}`);
  } catch (error) {
    console.error('❌ Email send error:', error.message);
  }
};

/**
 * Send refund receipt email
 */
export const sendRefundReceipt = async (refundData) => {
  const { 
    userEmail, 
    userName, 
    refundAmount, 
    previousBalance,
    newBalance, 
    timestamp, 
    transactionId,
    originalTransactionId,
    reason
  } = refundData;

  if (!userEmail) {
    console.log('⚠️ No email for user, skipping refund receipt');
    return;
  }

  const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { text-align: center; border-bottom: 3px solid #2196F3; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #2196F3; margin: 0; }
    .receipt-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
    .label { color: #666; font-weight: 500; }
    .value { color: #333; font-weight: 600; }
    .refund-amount { background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px; }
    .refund-amount .value { color: #4CAF50; font-size: 24px; }
    .balance-row { background: #f0f9f4; padding: 15px; border-radius: 8px; margin-top: 15px; }
    .info-box { background: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #4CAF50; }
    .info-box strong { color: #2e7d32; }
    .info-box p { margin: 5px 0 0 0; color: #666; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 NUCash Refund</h1>
      <p style="color: #666; margin: 5px 0;">Refund Confirmation</p>
    </div>
    
    <div class="receipt-row">
      <span class="label">Refund ID:</span>
      <span class="value">${transactionId}</span>
    </div>

    ${originalTransactionId ? `
    <div class="receipt-row">
      <span class="label">Original Transaction:</span>
      <span class="value">${originalTransactionId}</span>
    </div>
    ` : ''}
    
    <div class="receipt-row">
      <span class="label">Date & Time:</span>
      <span class="value">${new Date(timestamp).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })}</span>
    </div>
    
    <div class="receipt-row">
      <span class="label">Name:</span>
      <span class="value">${userName}</span>
    </div>

    ${reason ? `
    <div class="receipt-row">
      <span class="label">Reason:</span>
      <span class="value">${reason}</span>
    </div>
    ` : ''}
    
    <div class="refund-amount">
      <div class="receipt-row" style="border: none;">
        <span class="label" style="font-size: 18px;">Refund Amount:</span>
        <span class="value">+₱${refundAmount.toFixed(2)}</span>
      </div>
    </div>

    <div class="balance-row">
      <div class="receipt-row" style="border: none; margin-bottom: 8px;">
        <span class="label">Previous Balance:</span>
        <span class="value">₱${previousBalance.toFixed(2)}</span>
      </div>
      <div class="receipt-row" style="border: none;">
        <span class="label">New Balance:</span>
        <span class="value" style="color: #4CAF50;">₱${newBalance.toFixed(2)}</span>
      </div>
    </div>
    
    <div class="info-box">
      <strong>✅ Refund Processed</strong>
      <p>Your refund has been successfully processed and credited to your NUCash account.</p>
    </div>
    
    <div class="footer">
      <p>Thank you for using NUCash!</p>
      <p>This is an automated receipt. Please do not reply to this email.</p>
      <p style="margin-top: 10px; color: #aaa;">For balance inquiries, please log on to the NUCash Website.</p>
    </div>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: `"NUCash System" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: `NUCash Refund - ₱${refundAmount.toFixed(2)} Credited`,
    html: emailContent
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Refund receipt sent to ${userEmail}`);
  } catch (error) {
    console.error('❌ Refund email error:', error.message);
  }
};

/**
 * Send generic email
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  if (!to) {
    console.log('⚠️ No recipient email provided, skipping email');
    return;
  }

  const mailOptions = {
    from: `"NUCash System" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: html || text,
    text: text || undefined
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    throw error;
  }
};

/**
 * Send account activation OTP email
 */
export const sendActivationOTP = async (email, otp, fullName) => {
  if (!email) {
    console.log('⚠️ No email provided, skipping OTP');
    return;
  }

  const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { text-align: center; border-bottom: 3px solid #4CAF50; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #4CAF50; margin: 0; }
    .header p { color: #666; margin: 10px 0 0 0; }
    .otp-box { background: #f0f9f4; padding: 30px; text-align: center; border-radius: 10px; margin: 20px 0; border: 2px solid #4CAF50; }
    .otp-code { font-size: 48px; font-weight: bold; letter-spacing: 10px; color: #2e7d32; margin: 20px 0; font-family: monospace; }
    .otp-label { color: #666; font-size: 16px; font-weight: 600; margin: 0; }
    .otp-expiry { color: #666; font-size: 14px; margin: 10px 0 0 0; }
    .info-box { background: #e8f5e9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
    .info-box strong { color: #2e7d32; }
    .warning-box { background: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0; color: #e65100; }
    .warning-box strong { color: #e65100; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Account Activation</h1>
      <p>NUCash System</p>
    </div>

    <p>Hello <strong>${fullName}</strong>,</p>

    <p>Welcome to NUCash! Your account is almost ready. Please verify your email address to complete the activation process.</p>

    <div class="otp-box">
      <p class="otp-label">Your Verification Code</p>
      <div class="otp-code">${otp}</div>
      <p class="otp-expiry">Valid for 10 minutes</p>
    </div>

    <div class="info-box">
      <strong>📝 How to use this code:</strong>
      <ol style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>Return to the activation page</li>
        <li>Enter the 6-digit code above</li>
        <li>Click "Verify & Activate"</li>
      </ol>
    </div>

    <div class="warning-box">
      <strong>⚠️ Security Notice:</strong>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>This code expires in <strong>10 minutes</strong></li>
        <li>Never share this code with anyone</li>
        <li>NUCash staff will never ask for this code</li>
        <li>If you didn't request this, please ignore this email</li>
      </ul>
    </div>

    <p>If you didn't request account activation, please disregard this email. Your account will remain inactive.</p>

    <p>Need help? Contact us at <a href="mailto:nucashsystem@gmail.com" style="color: #4CAF50; text-decoration: none;">nucashsystem@gmail.com</a></p>

    <div class="footer">
      <p>This is an automated message from NUCash System</p>
      <p>National University - Laguna Campus</p>
      <p>&copy; 2026 NUCash. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: `"NUCash System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 NUCash Account Activation - Verification Code',
    html: emailContent
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Activation OTP sent to ${email}`);
  } catch (error) {
    console.error('❌ Activation OTP send error:', error.message);
    throw error;
  }
};

/**
 * Send temporary PIN email for new user registration
 */
export const sendTemporaryPIN = async (email, pin, fullName, schoolUId) => {
  if (!email) {
    console.log('⚠️ No email provided, skipping PIN email');
    return false;
  }

  const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { text-align: center; border-bottom: 3px solid #35408E; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #35408E; margin: 0; }
    .header p { color: #666; margin: 10px 0 0 0; }
    .welcome-box { background: #f0f4ff; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }
    .welcome-box h2 { color: #35408E; margin: 0 0 10px 0; }
    .pin-box { background: #FFD41C; padding: 30px; text-align: center; border-radius: 10px; margin: 20px 0; }
    .pin-code { font-size: 48px; font-weight: bold; letter-spacing: 15px; color: #181D40; margin: 10px 0; font-family: monospace; }
    .pin-label { color: #181D40; font-size: 16px; font-weight: 600; margin: 0; }
    .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
    .label { color: #666; font-weight: 500; }
    .value { color: #333; font-weight: 600; }
    .steps-box { background: #e8f5e9; padding: 20px; border-left: 4px solid #4CAF50; margin: 20px 0; }
    .steps-box h3 { color: #2e7d32; margin: 0 0 15px 0; }
    .steps-box ol { margin: 0; padding-left: 20px; }
    .steps-box li { margin: 8px 0; color: #333; }
    .warning-box { background: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0; }
    .warning-box strong { color: #e65100; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 Welcome to NUCash!</h1>
      <p>Your Digital Campus Wallet</p>
    </div>

    <div class="welcome-box">
      <h2>Hello, ${fullName}!</h2>
      <p>Your NUCash account has been created successfully.</p>
    </div>

    <div class="info-row">
      <span class="label">School ID:</span>
      <span class="value">${schoolUId}</span>
    </div>

    <div class="info-row">
      <span class="label">Email:</span>
      <span class="value">${email}</span>
    </div>

    <p style="margin-top: 20px;">Here is your temporary PIN to access your account:</p>

    <div class="pin-box">
      <p class="pin-label">Your Temporary PIN</p>
      <div class="pin-code">${pin}</div>
    </div>

    <div class="steps-box">
      <h3>📝 Next Steps:</h3>
      <ol>
        <li>Open the NUCash app or website</li>
        <li>Log in using your email and temporary PIN</li>
        <li>You will be prompted to change your PIN</li>
        <li>Create a new 6-digit PIN that only you know</li>
        <li>Your account will be activated after changing the PIN</li>
      </ol>
    </div>

    <div class="warning-box">
      <strong>⚠️ Important Security Notice:</strong>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>This temporary PIN is for <strong>first-time login only</strong></li>
        <li>You <strong>must change your PIN</strong> after your first login</li>
        <li>Never share your PIN with anyone</li>
        <li>NUCash staff will never ask for your PIN</li>
      </ul>
    </div>

    <p>If you did not request a NUCash account, please contact us immediately at <a href="mailto:nucashsystem@gmail.com" style="color: #35408E; text-decoration: none;">nucashsystem@gmail.com</a></p>

    <div class="footer">
      <p>This is an automated message from NUCash System</p>
      <p>National University - Laguna Campus</p>
      <p>&copy; 2026 NUCash. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: `"NUCash System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🎓 Welcome to NUCash - Your Temporary PIN',
    html: emailContent
  };

  try {
    console.log(`📧 Attempting to send temporary PIN email to ${email}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Temporary PIN email sent to ${email}`);
    console.log(`   Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Temporary PIN email error:', error.message);
    console.error('   Full error:', error);
    return false;
  }
};

/**
 * Send concern status update email (In Progress)
 */
export const sendConcernInProgressEmail = async (userEmail, userName, concernData) => {
  if (!userEmail) {
    console.log('⚠️ No email provided, skipping concern update email');
    return false;
  }

  const { concernId, subject, reportTo } = concernData;

  const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { text-align: center; border-bottom: 3px solid #35408E; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #35408E; margin: 0; }
    .header p { color: #666; margin: 10px 0 0 0; }
    .status-box { background: #FFD41C; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0; }
    .status-box .status-icon { font-size: 36px; margin-bottom: 10px; }
    .status-box .status-text { font-size: 18px; font-weight: bold; color: #181D40; margin: 0; }
    .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
    .label { color: #666; font-weight: 500; }
    .value { color: #333; font-weight: 600; }
    .message-box { background: #f0f4ff; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #35408E; }
    .message-box h3 { color: #35408E; margin: 0 0 10px 0; }
    .message-box p { margin: 0; color: #333; line-height: 1.6; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔄 Concern Update</h1>
      <p>NUCash Support Team</p>
    </div>

    <p>Hello <strong>${userName}</strong>,</p>

    <p>We wanted to let you know that your concern is now being reviewed by our team.</p>

    <div class="status-box">
      <div class="status-icon">📋</div>
      <p class="status-text">IN PROGRESS</p>
    </div>

    <div class="info-row">
      <span class="label">Reference ID:</span>
      <span class="value" style="font-family: monospace;">${concernId}</span>
    </div>

    <div class="info-row">
      <span class="label">Subject:</span>
      <span class="value">${subject}</span>
    </div>

    <div class="info-row">
      <span class="label">Assigned To:</span>
      <span class="value">${reportTo}</span>
    </div>

    <div class="message-box">
      <h3>📝 What's Next?</h3>
      <p>Our team is currently looking into your concern. We'll get back to you with a resolution as soon as possible.</p>
      <p style="margin-top: 10px;">You can track the status of your concern anytime by logging into your NUCash dashboard and visiting the "My Concerns" section.</p>
    </div>

    <p>Thank you for your patience!</p>

    <div class="footer">
      <p>This is an automated message from NUCash System</p>
      <p>National University - Laguna Campus</p>
      <p>&copy; 2026 NUCash. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: `"NUCash Support" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: `🔄 Your Concern is Being Reviewed - ${concernId}`,
    html: emailContent
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Concern in-progress email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Concern in-progress email error:', error.message);
    return false;
  }
};

/**
 * Send concern resolved email with admin reply
 */
export const sendConcernResolvedEmail = async (userEmail, userName, concernData) => {
  if (!userEmail) {
    console.log('⚠️ No email provided, skipping concern resolved email');
    return false;
  }

  const { concernId, subject, reportTo, adminReply, resolvedBy } = concernData;

  const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { text-align: center; border-bottom: 3px solid #35408E; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #35408E; margin: 0; }
    .header p { color: #666; margin: 10px 0 0 0; }
    .status-box { background: #4CAF50; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0; }
    .status-box .status-icon { font-size: 36px; margin-bottom: 10px; }
    .status-box .status-text { font-size: 18px; font-weight: bold; color: #FFFFFF; margin: 0; }
    .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
    .label { color: #666; font-weight: 500; }
    .value { color: #333; font-weight: 600; }
    .reply-box { background: #e8f5e9; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #4CAF50; }
    .reply-box h3 { color: #2e7d32; margin: 0 0 15px 0; }
    .reply-box .reply-content { color: #333; white-space: pre-wrap; line-height: 1.6; background: white; padding: 15px; border-radius: 8px; border: 1px solid #c8e6c9; }
    .next-steps { background: #f0f4ff; padding: 15px; border-left: 4px solid #35408E; margin: 20px 0; }
    .next-steps p { margin: 0; color: #333; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Concern Resolved</h1>
      <p>NUCash Support Team</p>
    </div>

    <p>Hello <strong>${userName}</strong>,</p>

    <p>Great news! Your concern has been reviewed and resolved by our team.</p>

    <div class="status-box">
      <div class="status-icon">✅</div>
      <p class="status-text">RESOLVED</p>
    </div>

    <div class="info-row">
      <span class="label">Reference ID:</span>
      <span class="value" style="font-family: monospace;">${concernId}</span>
    </div>

    <div class="info-row">
      <span class="label">Subject:</span>
      <span class="value">${subject}</span>
    </div>

    <div class="info-row">
      <span class="label">Handled By:</span>
      <span class="value">${reportTo}</span>
    </div>

    ${resolvedBy ? `
    <div class="info-row">
      <span class="label">Resolved By:</span>
      <span class="value">${resolvedBy}</span>
    </div>
    ` : ''}

    <div class="reply-box">
      <h3>📝 Response from ${reportTo}:</h3>
      <div class="reply-content">${adminReply}</div>
    </div>

    <div class="next-steps">
      <p>If you have any further questions or if the issue persists, please don't hesitate to submit a new concern through your NUCash dashboard.</p>
    </div>

    <p>Thank you for using NUCash!</p>

    <div class="footer">
      <p>This is an automated message from NUCash System</p>
      <p>National University - Laguna Campus</p>
      <p>&copy; 2026 NUCash. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: `"NUCash Support" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: `✅ Your Concern Has Been Resolved - ${concernId}`,
    html: emailContent
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Concern resolved email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Concern resolved email error:', error.message);
    return false;
  }
};

/**
 * Send deactivation OTP email
 */
export const sendDeactivationOtpEmail = async (email, userName, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@nucash.com',
    to: email,
    subject: '⚠️ NUCash - Account Deactivation Verification Code',
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { text-align: center; border-bottom: 3px solid #EF4444; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #EF4444; margin: 0; }
    .header p { color: #666; margin: 10px 0 0 0; }
    .otp-box { background: #fef2f2; padding: 30px; text-align: center; border-radius: 10px; margin: 20px 0; border: 2px solid #EF4444; }
    .otp-code { font-size: 48px; font-weight: bold; letter-spacing: 10px; color: #DC2626; margin: 20px 0; font-family: monospace; }
    .otp-label { color: #666; font-size: 16px; font-weight: 600; margin: 0; }
    .otp-expiry { color: #666; font-size: 14px; margin: 10px 0 0 0; }
    .warning-box { background: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0; color: #e65100; }
    .warning-box strong { color: #e65100; }
    .info-box { background: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; margin: 20px 0; }
    .info-box strong { color: #1976d2; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Account Deactivation Request</h1>
      <p>NUCash Verification Code</p>
    </div>

    <p>Hello <strong>${userName}</strong>,</p>

    <p>You have requested to deactivate your NUCash account. To proceed with this request, please use the verification code below:</p>

    <div class="otp-box">
      <p class="otp-label">Your Verification Code</p>
      <div class="otp-code">${otp}</div>
      <p class="otp-expiry">Valid for 10 minutes</p>
    </div>

    <div class="warning-box">
      <strong>⚠️ Important Warning:</strong>
      <p>Account deactivation will:</p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>Disable your ability to use NUCash services</li>
        <li>Require administrator approval to process</li>
        <li>Any remaining balance must be settled with the Treasury Office</li>
      </ul>
    </div>

    <div class="info-box">
      <strong>📝 If you did not request this:</strong>
      <p style="margin: 5px 0 0 0;">Please ignore this email and consider changing your PIN for security. Your account will remain active.</p>
    </div>

    <p>Need help? Contact the Treasury Office or email <a href="mailto:nucashsystem@gmail.com" style="color: #EF4444; text-decoration: none;">nucashsystem@gmail.com</a></p>

    <div class="footer">
      <p>This is an automated message from NUCash System</p>
      <p>National University - Laguna Campus</p>
      <p>&copy; 2026 NUCash. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Deactivation OTP sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send deactivation OTP email:', error);
    throw error;
  }
};

export default { sendReceipt, sendRefundReceipt, sendEmail, sendTemporaryPIN, sendConcernInProgressEmail, sendConcernResolvedEmail, sendDeactivationOtpEmail };