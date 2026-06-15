import { Sequelize } from 'sequelize';
import 'dotenv/config'; // Pastikan di server/app.js dipanggil pertama tapi untuk safety dipanggil di sini juga

const isProduction = process.env.NODE_ENV === 'production';

const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    keepAlive: true,
    ...(isProduction ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {})
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: false,
});

export default sequelize;