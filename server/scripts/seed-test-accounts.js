// server/scripts/seed-test-accounts.js
// Clears database and creates test admin accounts + test user

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Import models
import Admin from '../models/Admin.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import ShuttleTransaction from '../models/ShuttleTransaction.js';
import MerchantTransaction from '../models/MerchantTransaction.js';
import Trip from '../models/Trip.js';
import UserConcern from '../models/UserConcern.js';
import ExportHistory from '../models/ExportHistory.js';
import EventLog from '../models/EventLog.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nucash';

async function clearDatabase() {
  console.log('🗑️  Clearing database...');

  try {
    // Clear all collections
    await Admin.deleteMany({});
    await User.deleteMany({});
    await Transaction.deleteMany({});
    await ShuttleTransaction.deleteMany({});
    await MerchantTransaction.deleteMany({});
    await Trip.deleteMany({});
    await UserConcern.deleteMany({});
    await ExportHistory.deleteMany({});
    await EventLog.deleteMany({});

    console.log('✅ Database cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
}

async function seedAdmins() {
  console.log('\n👥 Creating admin accounts...');

  // Hash PIN for all admins (using "123456" as default)
  const defaultPin = await bcrypt.hash('123456', 10);

  const admins = [
    {
      adminId: 1,
      schoolUId: 'ADMIN-MOTORPOOL-001',
      lastName: 'Admin',
      firstName: 'Motorpool',
      middleName: 'Test',
      role: 'motorpool',
      email: 'motorpool@nu.edu.ph',
      pin: defaultPin,
      isActive: true
    },
    {
      adminId: 2,
      schoolUId: 'ADMIN-MERCHANT-001',
      lastName: 'Admin',
      firstName: 'Merchant',
      middleName: 'Test',
      role: 'merchant',
      email: 'merchant@nu.edu.ph',
      pin: defaultPin,
      isActive: true
    },
    {
      adminId: 3,
      schoolUId: 'ADMIN-TREASURY-001',
      lastName: 'Admin',
      firstName: 'Treasury',
      middleName: 'Test',
      role: 'treasury',
      email: 'treasury@nu.edu.ph',
      pin: defaultPin,
      isActive: true
    },
    {
      adminId: 4,
      schoolUId: 'ADMIN-ACCOUNTING-001',
      lastName: 'Admin',
      firstName: 'Accounting',
      middleName: 'Test',
      role: 'accounting',
      email: 'accounting@nu.edu.ph',
      pin: defaultPin,
      isActive: true
    },
    {
      adminId: 5,
      schoolUId: 'ADMIN-SYSAD-001',
      lastName: 'Admin',
      firstName: 'System',
      middleName: 'Test',
      role: 'sysad',
      email: 'sysad@nu.edu.ph',
      pin: defaultPin,
      isActive: true
    }
  ];

  try {
    await Admin.insertMany(admins);
    console.log('✅ Created admin accounts:');
    admins.forEach(admin => {
      console.log(`   - ${admin.role.toUpperCase()}: ${admin.email} (PIN: 123456)`);
    });
  } catch (error) {
    console.error('❌ Error creating admins:', error);
    throw error;
  }
}

async function seedTestUser() {
  console.log('\n👤 Creating test user...');

  // Hash PIN for test user (using "123456" as default)
  const defaultPin = await bcrypt.hash('123456', 10);

  const testUser = {
    userId: 1,
    schoolUId: '2021-123456',
    rfidUId: 'RFID-TEST-001',
    lastName: 'Dela Cruz',
    firstName: 'Juan',
    middleName: 'Santos',
    role: 'student',
    email: 'juan.delacruz@nu.edu.ph',
    pin: defaultPin,
    balance: 500.00,
    isActive: true,
    isVerified: true
  };

  try {
    await User.create(testUser);
    console.log('✅ Created test user:');
    console.log(`   - Name: ${testUser.firstName} ${testUser.middleName} ${testUser.lastName}`);
    console.log(`   - Email: ${testUser.email}`);
    console.log(`   - School ID: ${testUser.schoolUId}`);
    console.log(`   - RFID: ${testUser.rfidUId}`);
    console.log(`   - PIN: 123456`);
    console.log(`   - Balance: ₱${testUser.balance.toFixed(2)}`);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting database seeding process...\n');
    console.log('📡 Connecting to MongoDB:', MONGODB_URI);

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    await clearDatabase();

    // Seed new data
    await seedAdmins();
    await seedTestUser();

    console.log('\n✨ Database seeding completed successfully!\n');
    console.log('📋 Summary:');
    console.log('   - 5 Admin accounts created (all roles)');
    console.log('   - 1 Test user created');
    console.log('   - All accounts are active (isActive: true)');
    console.log('   - Default PIN for all accounts: 123456\n');

    console.log('🔐 Login Credentials:');
    console.log('   Motorpool Admin: motorpool@nu.edu.ph / 123456');
    console.log('   Merchant Admin: merchant@nu.edu.ph / 123456');
    console.log('   Treasury Admin: treasury@nu.edu.ph / 123456');
    console.log('   Accounting Admin: accounting@nu.edu.ph / 123456');
    console.log('   System Admin: sysad@nu.edu.ph / 123456');
    console.log('   Test User: juan.delacruz@nu.edu.ph / 123456\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

main();
