// nucash-server/seed.js
// FINAL: Schema v3.0 with counting IDs
// ⚠️  WARNING: This script DELETES ALL DATA in the database!

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import readline from 'readline';

// Safety check - require confirmation before running
async function confirmSeed() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\n⚠️  WARNING: This will DELETE ALL DATA in the database!');
    console.log('⚠️  This includes ALL users, admins, transactions, etc.\n');
    rl.question('Type "DELETE ALL DATA" to confirm: ', (answer) => {
      rl.close();
      if (answer === 'DELETE ALL DATA') {
        resolve(true);
      } else {
        console.log('❌ Seed cancelled. No data was deleted.');
        resolve(false);
      }
    });
  });
}

// Check if --force flag is passed (for automated scripts only)
const forceFlag = process.argv.includes('--force');
if (!forceFlag) {
  const confirmed = await confirmSeed();
  if (!confirmed) {
    process.exit(0);
  }
}

// Import models (ES6)
import User from './models/User.js';
import Driver from './models/Driver.js';
import Merchant from './models/Merchant.js';
import Shuttle from './models/Shuttle.js';
import Route from './models/Route.js';
import Setting from './models/Setting.js';
import Geofence from './models/Geofence.js';
import Admin from './models/Admin.js';
import Phone from './models/Phone.js';
import UserConcern from './models/UserConcern.js';
import Trip from './models/Trip.js';
import Transaction from './models/Transaction.js';
import ShuttleTransaction from './models/ShuttleTransaction.js';
import MerchantTransaction from './models/MerchantTransaction.js';
import EventLog from './models/EventLog.js';

dotenv.config();

// Counter for auto-increment userId
let userIdCounter = 10000;

async function seed() {
  try {
    console.log('\n🌱 Starting database seeding (Schema v3.0 - Counting IDs)...\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nucash';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // IMPORTANT: Drop old indexes first
    console.log('🗑️  Dropping old indexes...');
    try {
      const db = mongoose.connection.db;
      
      // Drop old cardUid index
      try {
        await db.collection('users').dropIndex('cardUid_1');
        console.log('  ✓ Dropped old cardUid_1 index');
      } catch (e) {
        if (e.code === 27) {
          console.log('  ℹ️  cardUid_1 index does not exist (OK)');
        }
      }

      // Drop old userId index (String version)
      try {
        await db.collection('users').dropIndex('userId_1');
        console.log('  ✓ Dropped old userId_1 index');
      } catch (e) {
        if (e.code === 27) {
          console.log('  ℹ️  userId_1 index does not exist (OK)');
        }
      }

      // Drop old rfidUid index (lowercase u version - OLD)
      try {
        await db.collection('users').dropIndex('rfidUid_1');
        console.log('  ✓ Dropped old rfidUid_1 index (lowercase)');
      } catch (e) {
        if (e.code === 27) {
          console.log('  ℹ️  rfidUid_1 index does not exist (OK)');
        }
      }

      // Drop old rfidUId index (capital U version)
      try {
        await db.collection('users').dropIndex('rfidUId_1');
        console.log('  ✓ Dropped old rfidUId_1 index (capital U)');
      } catch (e) {
        if (e.code === 27) {
          console.log('  ℹ️  rfidUId_1 index does not exist (OK)');
        }
      }

    } catch (error) {
      console.log('  ⚠️  Index cleanup:', error.message);
    }
    console.log('✅ Index cleanup complete\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Driver.deleteMany({});
    await Merchant.deleteMany({});
    await Shuttle.deleteMany({});
    await Route.deleteMany({});
    await Setting.deleteMany({});
    await Geofence.deleteMany({});
    await Admin.deleteMany({});
    await Phone.deleteMany({});
    await UserConcern.deleteMany({});

    // Clear transaction and log data
    await Trip.deleteMany({});
    await Transaction.deleteMany({});
    await ShuttleTransaction.deleteMany({});
    await MerchantTransaction.deleteMany({});
    await EventLog.deleteMany({});
    console.log('✅ Existing data cleared (including trips, transactions, and logs)\n');

    // Create system settings
    console.log('⚙️  Creating system settings...');
    await Setting.create({
      currentFare: 15,
      negativeLimit: -14,
      updatedBy: 'System'
    });
    console.log('✅ Settings created\n');

    // Create shuttles with COUNTING IDs
    console.log('🚌 Creating shuttles...');
    const shuttles = [
      {
        shuttleId: 'SHUTTLE_001',
        vehicleType: 'Isuzu',
        vehicleModel: 'Traviz',
        plateNumber: 'ABC 1234',
        capacity: 15,
        status: 'available',
        isActive: true
      },
      {
        shuttleId: 'SHUTTLE_002',
        vehicleType: 'Toyota',
        vehicleModel: 'Hiace',
        plateNumber: 'XYZ 5678',
        capacity: 14,
        status: 'available',
        isActive: true
      }
    ];

    for (const shuttleData of shuttles) {
      await Shuttle.create(shuttleData);
      console.log(`  ✓ Created shuttle: ${shuttleData.shuttleId} (${shuttleData.vehicleType} ${shuttleData.vehicleModel})`);
    }
    console.log('✅ Shuttles created\n');

    // Create phones FIRST (before drivers) - COUNTING IDs
    console.log('📱 Creating NFC phones...');
    const phones = [
      {
        phoneId: 'PHONE_001',
        phoneModel: 'Samsung Galaxy A14',
        phoneType: 'Android',
        serialNumber: 'SM-A145F-001',
        imei: '356789012345678',
        nfcEnabled: true,
        assignedDriverId: 'DRV001', // Will be assigned to Juan
        assignedDriverName: 'Juan P. Dela Cruz',
        assignedDate: new Date(),
        status: 'assigned',
        isActive: true,
        purchaseDate: new Date('2024-01-15'),
        notes: 'Primary device for shuttle operations'
      },
      {
        phoneId: 'PHONE_002',
        phoneModel: 'Samsung Galaxy A14',
        phoneType: 'Android',
        serialNumber: 'SM-A145F-002',
        imei: '356789012345679',
        nfcEnabled: true,
        assignedDriverId: null,
        assignedDriverName: null,
        assignedDate: null,
        status: 'available',
        isActive: true,
        purchaseDate: new Date('2024-01-15'),
        notes: 'Backup device'
      }
    ];

    for (const phoneData of phones) {
      await Phone.create(phoneData);
      console.log(`  ✓ Created phone: ${phoneData.phoneModel} (${phoneData.phoneId}) - ${phoneData.status}`);
    }
    console.log('✅ Phones created\n');

    // Create drivers with 6-digit PIN - COUNTING IDs
    console.log('👨‍✈️ Creating drivers...');
    const hashedDriverPin1 = await bcrypt.hash('123456', 10);
    const hashedDriverPin2 = await bcrypt.hash('111111', 10);

    const drivers = [
      {
        driverId: 'DRV001',
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        middleInitial: 'P',
        email: 'juan.delacruz@gmail.com',
        password: hashedDriverPin1, // 6-digit PIN: 123456
        shuttleId: null,
        isActive: true
      },
      {
        driverId: 'DRV002',
        firstName: 'Pedro',
        lastName: 'Santos',
        middleInitial: 'R',
        email: 'pedro.santos@gmail.com',
        password: hashedDriverPin2, // 6-digit PIN: 111111
        shuttleId: null,
        isActive: true
      }
    ];

    for (const driverData of drivers) {
      await Driver.create(driverData);
      const pin = driverData.email === 'juan.delacruz@gmail.com' ? '123456' : '111111';
      console.log(`  ✓ Created driver: ${driverData.firstName} ${driverData.lastName} (${driverData.driverId})`);
      console.log(`    Email: ${driverData.email} | PIN: ${pin} (hashed)`);
    }
    console.log('✅ Drivers created\n');

    // Create admin account - Single sysad
    console.log('👤 Creating admin account...');
    const hashedAdminPin = await bcrypt.hash('123456', 10);

    const admins = [
      {
        adminId: 1,
        schoolUId: 'ADMIN-001',
        rfidUId: 'ADMIN-RFID-001',
        firstName: 'System',
        lastName: 'Administrator',
        middleName: '',
        role: 'sysad',
        email: 'admin@nu.edu.ph',
        pin: hashedAdminPin, // 123456
        verified: true,
        isActive: true,
        lastLogin: null
      }
    ];

    for (const adminData of admins) {
      await Admin.create(adminData);
      console.log(`  ✓ Created admin: ${adminData.firstName} ${adminData.lastName} (${adminData.role})`);
      console.log(`    Email: ${adminData.email} | PIN: 123456 (hashed)`);
    }
    console.log('✅ Admin account created\n');

    // Create routes - COUNTING IDs (New from/to structure)
    console.log('🗺️  Creating routes...');
    const routes = [
      {
        routeId: 'ROUTE_001',
        routeName: 'NU Laguna → SM Calamba',
        fromName: 'NU Laguna',
        fromLatitude: 14.17815,
        fromLongitude: 121.1359,
        toName: 'SM Calamba',
        toLatitude: 14.203425,
        toLongitude: 121.155109,
        fare: 15,
        active: true,
        order: 1
      },
      {
        routeId: 'ROUTE_002',
        routeName: 'SM Calamba → NU Laguna',
        fromName: 'SM Calamba',
        fromLatitude: 14.203425,
        fromLongitude: 121.155109,
        toName: 'NU Laguna',
        toLatitude: 14.17815,
        toLongitude: 121.1359,
        fare: 15,
        active: true,
        order: 2
      }
    ];

    for (const routeData of routes) {
      await Route.create(routeData);
      console.log(`  ✓ Created route: ${routeData.routeName} (${routeData.routeId})`);
    }
    console.log('✅ Routes created\n');

    // Create geofences
    console.log('📍 Creating geofences...');
    const geofences = [
      {
        name: 'NU Laguna Campus',
        description: 'National University - Laguna Campus',
        latitude: 14.17815,
        longitude: 121.1359,
        radius: 100,
        type: 'campus',
        active: true,
        order: 1
      },
      {
        name: 'SM Calamba Terminal',
        description: 'SM City Calamba - Shuttle Terminal',
        latitude: 14.203425,
        longitude: 121.155109,
        radius: 100,
        type: 'terminal',
        active: true,
        order: 2
      }
    ];

    for (const geofenceData of geofences) {
      await Geofence.create(geofenceData);
      console.log(`  ✓ Created geofence: ${geofenceData.name}`);
    }
    console.log('✅ Geofences created\n');

    // Summary
    console.log('┌────────────────────────────────┐');
    console.log('│ 📊 SUMMARY (Schema v3.0):      │');
    console.log('└────────────────────────────────┘');
    console.log(`Admins: ${admins.length}`);
    console.log(`Shuttles: ${shuttles.length}`);
    console.log(`Drivers: ${drivers.length}`);
    console.log(`Routes: ${routes.length}`);
    console.log(`Geofences: ${geofences.length}`);
    console.log(`Phones: ${phones.length}`);
    console.log('');

    console.log('🔑 ADMIN ACCOUNT (System Administrator):');
    console.log('┌──────────────────────────────────────────────────────────┐');
    console.log('│ Email:           admin@nu.edu.ph                         │');
    console.log('│ PIN:             123456                                  │');
    console.log('│ Role:            sysad (System Administrator)            │');
    console.log('│ Access:          Full system access                      │');
    console.log('└──────────────────────────────────────────────────────────┘\n');

    console.log('👨‍✈️ DRIVER ACCOUNTS:');
    console.log('┌──────────────────────────────────────────────────────────┐');
    console.log('│ Driver 1:        juan.delacruz@gmail.com                │');
    console.log('│                  PIN: 123456                             │');
    console.log('│                                                          │');
    console.log('│ Driver 2:        pedro.santos@gmail.com                 │');
    console.log('│                  PIN: 111111                             │');
    console.log('└──────────────────────────────────────────────────────────┘\n');

    console.log('🏪 MERCHANT ACCOUNTS:');
    console.log('┌──────────────────────────────────────────────────────────┐');
    console.log('│ No merchants seeded.                                     │');
    console.log('│ Create merchants via Merchant Admin Portal:             │');
    console.log('│ http://localhost:3000/merchant.html                      │');
    console.log('└──────────────────────────────────────────────────────────┘\n');

    console.log('📱 TEST PHONES:');
    console.log('┌────────────────────────────────────────────┐');
    phones.forEach(phone => {
      console.log(`│ ${phone.phoneModel} (${phone.phoneId})`);
      console.log(`│   Status: ${phone.status.toUpperCase()}`);
      if (phone.assignedDriverName) {
        console.log(`│   Assigned to: ${phone.assignedDriverName}`);
      }
      console.log('│');
    });
    console.log('└────────────────────────────────────────────┘\n');

    console.log('✅ Schema v3.0 seeding complete with COUNTING IDs!\n');
    console.log('📋 ID FORMAT:');
    console.log('   Shuttles: SHUTTLE_001, SHUTTLE_002, ...');
    console.log('   Phones:   PHONE_001, PHONE_002, ...');
    console.log('   Drivers:  DRV001, DRV002, ...');
    console.log('   Routes:   ROUTE_001, ROUTE_002, ...\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

console.log('\n🌱 NUCash Database Seeder v3.0 (Counting IDs)\n');
seed();