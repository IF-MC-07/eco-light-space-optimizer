export default {
  accessSecret: process.env.JWT_ACCESS_SECRET || '',
  refreshSecret: process.env.JWT_REFRESH_SECRET || '',
  accessExpires: '15m',
  refreshExpires: '30d',
  algorithm: 'HS256',
};