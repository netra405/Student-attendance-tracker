import nodemailer from 'nodemailer';

// Create transporter for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_PASSWORD,
  },
});

export async function sendVerificationEmail(email: string, code: string) {
  try {
    const mailOptions = {
      from: process.env.GMAIL_EMAIL,
      to: email,
      subject: 'Attendance Tracker - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #0066cc; font-size: 48px; letter-spacing: 8px;">${code}</h1>
          <p style="color: #666;">This code will expire in 10 minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}

export function generateVerificationCode(): string {
  return Math.random().toString().slice(2, 8);
}

export function getVerificationExpires(): Date {
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 10);
  return expires;
}

export async function sendResetPasswordEmail(email: string, code: string) {
  try {
    const mailOptions = {
      from: process.env.GMAIL_EMAIL,
      to: email,
      subject: 'Attendance Tracker - Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p>Use this code to reset your password:</p>
          <h1 style="color: #d97706; font-size: 48px; letter-spacing: 8px;">${code}</h1>
          <p style="color: #666;">This code will expire in 10 minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Reset password email error:', error);
    return false;
  }
}
