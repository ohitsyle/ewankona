// nucash-server/scripts/seedAdmins.js
// Script to seed test admin accounts with proper password hashing

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Admin from '../models/Admin.js';
import dotenv from 'dotenv';

dotenv.config();

async function seedAdmins() {
  try {
    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing admins (OPTIONAL - comment out if you want to keep existing)
    console.log('🗑️  Clearing existing admin accounts...');
    await Admin.deleteMany({});
    console.log('✅ Existing admins cleared');

    // Create test admins
    const admins = [
      {
        adminId: 1,
        schoolUId: 'ADMIN001',
        rfidUId: 'RFID001',
        firstName: 'System',
        lastName: 'Administrator',
        middleName: '',
        email: 'admin@nu.edu.ph',
        pin: '123456', // Will be hashed
        role: 'sysad',
        isActive: true,
        verified: true
      },
      {
        adminId: 2,
        schoolUId: 'ADMIN002',
        rfidUId: 'RFID002',
        firstName: 'Motorpool',
        lastName: 'Manager',
        middleName: '',
        email: 'motorpool@nu.edu.ph',
        pin: '123456', // Will be hashed
        role: 'motorpool',
        isActive: true,
        verified: true
      },
      {
        adminId: 3,
        schoolUId: 'ADMIN003',
        rfidUId: 'RFID003',
        firstName: 'Treasury',
        lastName: 'Officer',
        middleName: '',
        email: 'treasury@nu.edu.ph',
        pin: '123456', // Will be hashed
        role: 'treasury',
        isActive: true,
        verified: true
      }
    ];

    console.log('\n🔐 Creating admin accounts...');

    for (const adminData of admins) {
      // Hash PIN
      const salt = await bcrypt.genSalt(10);
      const hashedPin = await bcrypt.hash(adminData.pin, salt);

      // Create admin
      const admin = new Admin({
        ...adminData,
        pin: hashedPin
      });

      await admin.save();

      console.log(`✅ Created: ${admin.email} (${admin.role})`);
      console.log(`   PIN: ${adminData.pin} (unhashed for testing)`);
    }

    console.log('\n✅ All admins created successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: admin@nu.edu.ph');
    console.log('PIN: 123456');
    console.log('Role: System Admin (sysad)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: motorpool@nu.edu.ph');
    console.log('PIN: 123456');
    console.log('Role: Motorpool Admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: treasury@nu.edu.ph');
    console.log('PIN: 123456');
    console.log('Role: Treasury Admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Disconnect
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

// Run the seed function
seedAdmins();