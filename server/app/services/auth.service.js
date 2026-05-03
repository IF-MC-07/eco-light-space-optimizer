import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../models/index.js';
import { sendEmail } from '../utils/email.js';

const { User } = db;

export const register = async (data) => {
  const existingUser = await User.findOne({ where: { email: data.email } });
  if (existingUser) {
    throw new Error('Email sudah terdaftar.');
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  const newUser = await User.create({
    name: data.name,
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
    throw new Error('Email atau kata sandi salah.');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Email atau kata sandi salah.');
  }

  const token = jwt.sign(
    { user_id: user.user_id, role: user.role },
    process.env.JWT_SECRET,
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
    throw new Error('Email tidak ditemukan.');
  }

  const resetToken = jwt.sign(
    { user_id: user.user_id },
    process.env.JWT_SECRET + user.password, // using current hash to invalidate token once changed
    { expiresIn: '15m' }
  );

  const clientUrl = process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000';
  const resetLink = `${clientUrl}/reset-password?token=${resetToken}&id=${user.user_id}`;

  const html = `
    <h1>Reset Password</h1>
    <p>Halo ${user.name},</p>
    <p>Silakan klik tautan di bawah ini untuk mereset kata sandi Anda. Tautan ini hanya berlaku selama 15 menit.</p>
    <a href="${resetLink}">Reset Kata Sandi</a>
    <p>Jika Anda tidak merasa meminta reset kata sandi, abaikan email ini.</p>
  `;

  await sendEmail({
    to: user.email,
    subject: 'Reset Kata Sandi - Eco-Light Space Optimizer',
    html,
  });

  return { message: 'Email instruksi reset kata sandi telah dikirim.' };
};

export const resetPassword = async (user_id, token, new_password) => {
  const user = await User.findByPk(user_id);
  if (!user) {
    throw new Error('Invalid user.');
  }

  const secret = process.env.JWT_SECRET + user.password;
  try {
    jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Token tidak valid atau telah kadaluarsa.');
  }

  const hashedPassword = await bcrypt.hash(new_password, 10);
  await user.update({ password: hashedPassword });

  return { message: 'Kata sandi berhasil direset.' };
};
