import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../models/index.js';
import { sendEmail } from '../utils/email.js';

if (!process.env.JWT_ACCESS_SECRET) {
  throw new Error('FATAL: JWT_ACCESS_SECRET is not defined in environment variables');
}

const { User } = db;

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
    role: 'user', // default role
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

  const token = jwt.sign(
    { user_id: user.user_id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '7d' }
  );

  const { password: userPassword, ...userWithoutPassword } = user.toJSON();
  return { token, user: userWithoutPassword };
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
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error('Email not found.');
  }

  const resetToken = jwt.sign(
    { user_id: user.user_id },
    process.env.JWT_ACCESS_SECRET + user.password, // using current hash to invalidate token once changed
    { expiresIn: '15m' }
  );

  const clientUrl = process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000';
  const resetLink = `${clientUrl}/reset-password?token=${resetToken}&id=${user.user_id}`;

  const html = `
    <h1>Reset Password</h1>
    <p>Hello ${user.name},</p>
    <p>Please click the link below to reset your password. This link is only valid for 15 minutes.</p>
    <a href="${resetLink}">Reset Password</a>
    <p>If you do not feel like requesting a password reset, ignore this email.</p>
  `;

  await sendEmail({
    to: user.email,
    subject: 'Reset Password - Eco-Light Space Optimizer',
    html,
  });

  return { message: 'Reset password instructions have been sent to your email.' };
};

export const resetPassword = async (user_id, token, new_password) => {
  const user = await User.findByPk(user_id);
  if (!user) {
    throw new Error('Invalid user.');
  }

  const secret = process.env.JWT_ACCESS_SECRET + user.password;
  try {
    jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid token or expired.');
  }

  const hashedPassword = await bcrypt.hash(new_password, 10);
  await user.update({ password: hashedPassword });

  return { message: 'Password has been reset successfully.' };
};
