import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Import Admin model
import Admin from '../models/Admin.js';

const merchantAdmins = [
  {
    adminId: 100,
    schoolUId: 'ADMIN-100',
    rfidUId: 'RFID-MERCHANT-001',
    lastName: 'Admin',
    firstName: 'Merchant',
    middleName: '',
    role: 'merchant',
    email: 'merchant@nu.edu.ph',
    pin: '123456',
    verified: true,
    isActive: true,
    termsAccepted: true
  },
  {
    adminId: 101,
    schoolUId: 'ADMIN-101',
    rfidUId: 'RFID-MERCHANT-002',
    lastName: 'Manager',
    firstName: 'Cafeteria',
    middleName: '',
    role: 'merchant',
    email: 'cafeteria@nu.edu.ph',
    pin: '123456',
    verified: true,
    isActive: true,
    termsAccepted: true
  },
  {
    adminId: 102,
    schoolUId: 'ADMIN-102',
    rfidUId: 'RFID-MERCHANT-003',
    lastName: 'Manager',
    firstName: 'Bookstore',
    middleName: '',
    role: 'merchant',
    email: 'bookstore@nu.edu.ph',
    pin: '123456',
    verified: true,
    isActive: true,
    termsAccepted: true
  }
];

async function seedMerchantAdmins() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🗑️  Clearing existing merchant admins...');
    await Admin.deleteMany({ role: 'merchant' });

    console.log('🌱 Seeding merchant admins...\n');

    for (const adminData of merchantAdmins) {
      // Hash the PIN
      const hashedPin = await bcrypt.hash(adminData.pin, 10);
      const admin = new Admin({
        ...adminData,
        pin: hashedPin
      });
      await admin.save();
      console.log(`✅ Created merchant admin: ${admin.firstName} ${admin.lastName} (${admin.email})`);
    }

    console.log('\n✅ All merchant admins seeded successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('   Email: merchant@nu.edu.ph    | PIN: 123456 (Merchant Admin)');
    console.log('   Email: cafeteria@nu.edu.ph   | PIN: 123456 (Cafeteria Manager)');
    console.log('   Email: bookstore@nu.edu.ph   | PIN: 123456 (Bookstore Manager)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding merchant admins:', error);
    process.exit(1);
  }
}

seedMerchantAdmins();
