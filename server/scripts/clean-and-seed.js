// nucash-server/scripts/clean-and-seed.js
// Drops old indexes and runs seed with Schema v3.0

import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function cleanAndSeed() {
  try {
    console.log('\n🧹 NUCash Database Cleaner & Seeder v3.0\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nucash';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Drop old indexes
    console.log('🗑️  Dropping old indexes...');
    
    try {
      const db = mongoose.connection.db;
      
      // Drop old user indexes (cardUid_1)
      try {
        await db.collection('users').dropIndex('cardUid_1');
        console.log('  ✓ Dropped users.cardUid_1 index');
      } catch (e) {
        if (e.code === 27) {
          console.log('  ℹ️  users.cardUid_1 index does not exist (already dropped)');
        } else {
          console.log('  ⚠️  Could not drop users.cardUid_1:', e.message);
        }
      }

      // Drop old userId index if it's a string index
      try {
        await db.collection('users').dropIndex('userId_1');
        console.log('  ✓ Dropped users.userId_1 index (will be recreated as Number)');
      } catch (e) {
        if (e.code === 27) {
          console.log('  ℹ️  users.userId_1 index does not exist');
        } else {
          console.log('  ⚠️  Could not drop users.userId_1:', e.message);
        }
      }

      console.log('✅ Old indexes cleaned\n');
    } catch (error) {
      console.log('⚠️  Index cleanup warning:', error.message);
      console.log('Continuing with seed...\n');
    }

    // Step 2: Clear collections
    console.log('🗑️  Clearing all collections...');
    const collections = await mongoose.connection.db.collections();
    
    for (const collection of collections) {
      await collection.deleteMany({});
      console.log(`  ✓ Cleared ${collection.collectionName}`);
    }
    console.log('✅ All collections cleared\n');

    // Step 3: Close connection
    await mongoose.connection.close();
    console.log('✅ Database cleaned successfully\n');
    
    console.log('🌱 Now run: node seed.js\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

cleanAndSeed();