import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../models/index.js';
import { sendEmail } from '../utils/email.js';

const { Pengguna } = db;

export const register = async (data) => {
  const existingUser = await Pengguna.findOne({ where: { email: data.email } });
  if (existingUser) {
    throw new Error('Email sudah terdaftar.');
  }

  const hashedPassword = await bcrypt.hash(data.kata_sandi, 10);
  
  const newUser = await Pengguna.create({
    nama: data.nama,
    email: data.email,
    kata_sandi: hashedPassword,
    peran: 'user', // default role
  });

  const { kata_sandi, ...userWithoutPassword } = newUser.toJSON();
  return userWithoutPassword;
};

export const login = async (email, password) => {
  const user = await Pengguna.findOne({ where: { email } });
  if (!user) {
    throw new Error('Email atau kata sandi salah.');
  }

  const isMatch = await bcrypt.compare(password, user.kata_sandi);
  if (!isMatch) {
    throw new Error('Email atau kata sandi salah.');
  }

  const token = jwt.sign(
    { id_pengguna: user.id_pengguna, peran: user.peran },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { kata_sandi, ...userWithoutPassword } = user.toJSON();
  return { token, user: userWithoutPassword };
};

export const getProfile = async (id_pengguna) => {
  const user = await Pengguna.findByPk(id_pengguna, {
    attributes: { exclude: ['kata_sandi'] },
  });
  if (!user) {
    throw new Error('Pengguna tidak ditemukan.');
  }
  return user;
};

export const forgotPassword = async (email) => {
  const user = await Pengguna.findOne({ where: { email } });
  if (!user) {
    throw new Error('Email tidak ditemukan.');
  }

  const resetToken = jwt.sign(
    { id_pengguna: user.id_pengguna },
    process.env.JWT_SECRET + user.kata_sandi, // using current hash to invalidate token once changed
    { expiresIn: '15m' }
  );

  const clientUrl = process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000';
  const resetLink = `${clientUrl}/reset-password?token=${resetToken}&id=${user.id_pengguna}`;

  const html = `
    <h1>Reset Password</h1>
    <p>Halo ${user.nama},</p>
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

export const resetPassword = async (id_pengguna, token, kata_sandi_baru) => {
  const user = await Pengguna.findByPk(id_pengguna);
  if (!user) {
    throw new Error('Pengguna tidak valid.');
  }

  const secret = process.env.JWT_SECRET + user.kata_sandi;
  try {
    jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Token tidak valid atau telah kadaluarsa.');
  }

  const hashedPassword = await bcrypt.hash(kata_sandi_baru, 10);
  await user.update({ kata_sandi: hashedPassword });

  return { message: 'Kata sandi berhasil direset.' };
};
