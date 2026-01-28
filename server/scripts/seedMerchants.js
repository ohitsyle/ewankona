import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Import Merchant model
import Merchant from '../models/Merchant.js';

const merchants = [
  {
    merchantId: 'MER-001',
    businessName: 'NU Cafeteria',
    contactPerson: 'Cafeteria Manager',
    email: 'merchant@nu.edu.ph',
    password: '123456',
    phone: '09171234567',
    address: 'Main Building Ground Floor',
    isActive: true
  },
  {
    merchantId: 'MER-002',
    businessName: 'NU Bookstore',
    contactPerson: 'Bookstore Manager',
    email: 'bookstore@nu.edu.ph',
    password: '123456',
    phone: '09171234568',
    address: 'Academic Building 1st Floor',
    isActive: true
  },
  {
    merchantId: 'MER-003',
    businessName: 'NU Print Shop',
    contactPerson: 'Print Manager',
    email: 'printshop@nu.edu.ph',
    password: '123456',
    phone: '09171234569',
    address: 'Library Building',
    isActive: true
  }
];

async function seedMerchants() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🗑️  Clearing existing merchants...');
    await Merchant.deleteMany({});

    console.log('🌱 Seeding merchants...\n');

    for (const merchantData of merchants) {
      // The Merchant model will auto-hash the password in the pre-save hook
      const merchant = new Merchant(merchantData);
      await merchant.save();
      console.log(`✅ Created merchant: ${merchant.businessName} (${merchant.email})`);
    }

    console.log('\n✅ All merchants seeded successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('   Email: merchant@nu.edu.ph    | PIN: 123456 (Cafeteria)');
    console.log('   Email: bookstore@nu.edu.ph   | PIN: 123456 (Bookstore)');
    console.log('   Email: printshop@nu.edu.ph   | PIN: 123456 (Print Shop)');

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding merchants:', error);
    process.exit(1);
  }
}

seedMerchants();
