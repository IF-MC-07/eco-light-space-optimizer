import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_PORT == 465 || process.env.SMTP_USE_SSL === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  family: 4 // Force IPv4 to prevent ENETUNREACH on IPv6
});

export const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ SMTP server is ready');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    return false;
  }
};

export default transporter;