import { Sequelize } from 'sequelize';
import 'dotenv/config'; // Pastikan di server/app.js dipanggil pertama tapi untuk safety dipanggil di sini juga

const isProduction = process.env.NODE_ENV === 'production';

const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: isProduction ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {},
  logging: false, // Ubah ke console.log jika ingin melihat log query SQL
});

export default sequelize;