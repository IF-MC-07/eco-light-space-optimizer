import bcrypt from 'bcrypt';
import db from './app/models/index.js';
import 'dotenv/config';

const { User } = db;

async function runSeed() {
  try {
    console.log('⏳ Connecting to database...');
    
    // Jika command dijalankan dengan flag --reset
    if (process.argv.includes('--reset')) {
      console.log('⚠️ Resetting database (dropping and re-creating all tables)...');
      await db.sequelize.sync({ force: true });
      console.log('✅ Database reset complete.');
    } else {
      await db.sequelize.sync();
    }

    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@ecolight.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';

    // ==========================================
    // 1. Check and Create Admin
    // ==========================================
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
      // Hash password dengan bcrypt, saltRounds = 12
      const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);
      
      await User.create({
        name: 'Administrator',
        username: 'admin',
        email: adminEmail,
        password: hashedAdminPassword,
        role: 'admin',
      });
      console.log(`✅ Admin created successfully (${adminEmail})`);
    } else {
      console.log(`ℹ️ Admin already exists (${adminEmail}) - Skipped`);
    }

    // ==========================================
    // 2. Check and Create Test User
    // ==========================================
    const userEmail = 'user@ecolight.com';
    const userPassword = 'User@12345';
    
    const existingUser = await User.findOne({ where: { email: userEmail } });
    if (!existingUser) {
      const hashedUserPassword = await bcrypt.hash(userPassword, 12);
      
      await User.create({
        name: 'Test User',
        username: 'testuser',
        email: userEmail,
        password: hashedUserPassword,
        role: 'mahasiswa',
      });
      console.log(`✅ Test User created successfully (${userEmail})`);
    } else {
      console.log(`ℹ️ Test User already exists (${userEmail}) - Skipped`);
    }

    console.log('🌱 Seeding finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

runSeed();
