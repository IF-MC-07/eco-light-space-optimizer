import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../models/index.js';
import { sendEmail } from '../utils/email.js';
import jwtConfig from '../config/jwt.js';

const { User } = db;

const generateAccessToken = (user) => {
  return jwt.sign(
    { user_id: user.user_id, role: user.role },
    jwtConfig.JWT_SECRET,
    { expiresIn: jwtConfig.ACCESS_TOKEN_EXPIRY }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { user_id: user.user_id, role: user.role },
    jwtConfig.JWT_REFRESH_SECRET,
    { expiresIn: jwtConfig.REFRESH_TOKEN_EXPIRY }
  );
};

export const register = async (data) => {
  const existingUser = await User.findOne({ where: { email: data.email } });
  if (existingUser) {
    throw new Error('Email already exists.');
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  const newUser = await User.create({
    name: data.name,
    username: data.username,
    email: data.email,
    password: hashedPassword,
    role: 'mahasiswa', // default role
  });

  const { password, ...userWithoutPassword } = newUser.toJSON();
  return userWithoutPassword;
};

export const login = async (email, password) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error('Email or password is wrong.');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Email or password is wrong.');
  }

  const token = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const { password: userPassword, ...userWithoutPassword } = user.toJSON();
  return { token, refreshToken, user: userWithoutPassword };
};

export const getProfile = async (user_id) => {
  const user = await User.findByPk(user_id, {
    attributes: { exclude: ['password'] },
  });
  if (!user) {
    throw new Error('User not found.');
  }
  return user;
};

export const forgotPassword = async (email) => {
  // Security: always return the same ambiguous message to prevent account enumeration.
  // We silently do nothing if the email doesn't exist.
  const AMBIGUOUS_MSG = { message: 'If that email is registered, you will receive reset instructions shortly.' };

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return AMBIGUOUS_MSG; // silent fail — no error thrown
  }

  const resetToken = jwt.sign(
    { user_id: user.user_id },
    jwtConfig.JWT_SECRET + user.password, // using current hash to invalidate token once changed
    { expiresIn: jwtConfig.ACCESS_TOKEN_EXPIRY }
  );

  const clientUrl = process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000';
  const resetLink = `${clientUrl}/reset-password?token=${resetToken}&id=${user.user_id}`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f7f6;">
      <div style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background-color: #10b981; padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Eco-Light Space Optimizer</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; font-size: 20px; margin-top: 0; margin-bottom: 20px;">Password Reset Request</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Hello <strong>${user.name}</strong>,
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            We received a request to reset the password for your Eco-Light Space Optimizer account. Click the button below to choose a new password. This link is valid for the next 15 minutes.
          </p>
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${resetLink}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);">Reset Password</a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-bottom: 0;">
            If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
        </div>
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} Eco-Light Space Optimizer. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: 'Reset Password - Eco-Light Space Optimizer',
    html,
  });

  return AMBIGUOUS_MSG;
};

export const resetPassword = async (user_id, token, new_password) => {
  const user = await User.findByPk(user_id);
  if (!user) {
    throw new Error('Invalid user.');
  }

  const secret = jwtConfig.JWT_SECRET + user.password;
  try {
    jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid token or expired.');
  }

  const hashedPassword = await bcrypt.hash(new_password, 10);
  await user.update({ password: hashedPassword });

  return { message: 'Password has been reset successfully.' };
};
