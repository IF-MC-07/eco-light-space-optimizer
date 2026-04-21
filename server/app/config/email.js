import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_USE_SSL === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
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