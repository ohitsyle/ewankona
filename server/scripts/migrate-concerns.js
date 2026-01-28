// nucash-server/scripts/migrate-concerns.js
// Migration script to update UserConcern documents to new schema

import mongoose from 'mongoose';
import UserConcern from '../models/UserConcern.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nucash';

async function migrateConcerns() {
  try {
    console.log('🚀 Starting UserConcern migration...');
    console.log(`📦 Connecting to: ${MONGODB_URI}`);

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database');

    // Get all existing concerns
    const concerns = await UserConcern.find({}).lean();
    console.log(`📊 Found ${concerns.length} existing concerns`);

    let assistanceCount = 0;
    let feedbackCount = 0;
    let errorCount = 0;

    // Process each concern
    for (const concern of concerns) {
      try {
        const updates = {};

        // 1. Determine submissionType based on existing data
        if (!concern.submissionType) {
          // If has category/title/description, it's likely an assistance request
          // If has rating, it's feedback
          if (concern.rating !== undefined && concern.rating !== null) {
            updates.submissionType = 'feedback';
            feedbackCount++;
          } else {
            updates.submissionType = 'assistance';
            assistanceCount++;
          }
        }

        // 2. Handle assistance-specific fields
        if (updates.submissionType === 'assistance' || concern.submissionType === 'assistance') {
          // Convert old category to selectedConcerns array if needed
          if (!concern.selectedConcerns || concern.selectedConcerns.length === 0) {
            if (concern.category) {
              updates.selectedConcerns = [concern.category];
            } else if (concern.title) {
              updates.selectedConcerns = [concern.title];
            } else {
              updates.selectedConcerns = ['General Concern'];
            }
          }

          // Set default status if missing
          if (!concern.status) {
            updates.status = 'pending';
          }

          // Set default priority if missing
          if (!concern.priority) {
            updates.priority = 'medium';
          }

          // Generate AST concernId if missing or wrong format
          if (!concern.concernId || !concern.concernId.startsWith('AST-')) {
            const date = new Date(concern.submittedAt || concern.createdAt || Date.now());
            const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
            const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
            updates.concernId = `AST-${dateStr}-${randomHex}`;
          }
        }

        // 3. Handle feedback-specific fields
        if (updates.submissionType === 'feedback' || concern.submissionType === 'feedback') {
          // Clear status and priority for feedback
          updates.status = null;
          updates.priority = null;

          // Ensure rating exists
          if (concern.rating === undefined || concern.rating === null) {
            updates.rating = 3; // Default to 3 stars if missing
          }

          // Set default subject if missing
          if (!concern.subject) {
            updates.subject = concern.title || 'User Feedback';
          }

          // Set feedbackText from description if missing
          if (!concern.feedbackText && concern.description) {
            updates.feedbackText = concern.description;
          }

          // Generate FBK concernId if missing or wrong format
          if (!concern.concernId || !concern.concernId.startsWith('FBK-')) {
            const date = new Date(concern.submittedAt || concern.createdAt || Date.now());
            const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
            const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
            updates.concernId = `FBK-${dateStr}-${randomHex}`;
          }
        }

        // 4. Ensure required user fields exist
        if (!concern.userName) {
          updates.userName = 'Anonymous';
        }
        if (!concern.userEmail) {
          updates.userEmail = 'no-email@example.com';
        }

        // 5. Update the document
        if (Object.keys(updates).length > 0) {
          await UserConcern.updateOne(
            { _id: concern._id },
            { $set: updates }
          );
          console.log(`✅ Updated concern ${concern._id} (${updates.submissionType || concern.submissionType})`);
        }

      } catch (error) {
        console.error(`❌ Error processing concern ${concern._id}:`, error.message);
        errorCount++;
      }
    }

    // Print summary
    console.log('\n📊 Migration Summary:');
    console.log(`   Total concerns: ${concerns.length}`);
    console.log(`   Assistance requests: ${assistanceCount}`);
    console.log(`   Feedback submissions: ${feedbackCount}`);
    console.log(`   Errors: ${errorCount}`);

    // Validate migration
    console.log('\n🔍 Validating migration...');
    const assistanceWithoutType = await UserConcern.countDocuments({
      submissionType: 'assistance',
      $or: [
        { selectedConcerns: { $exists: false } },
        { selectedConcerns: { $size: 0 } }
      ]
    });

    const feedbackWithoutRating = await UserConcern.countDocuments({
      submissionType: 'feedback',
      $or: [
        { rating: { $exists: false } },
        { rating: null }
      ]
    });

    const missingConcernId = await UserConcern.countDocuments({
      $or: [
        { concernId: { $exists: false } },
        { concernId: null },
        { concernId: '' }
      ]
    });

    console.log(`   Assistance without selectedConcerns: ${assistanceWithoutType}`);
    console.log(`   Feedback without rating: ${feedbackWithoutRating}`);
    console.log(`   Missing concernId: ${missingConcernId}`);

    if (assistanceWithoutType === 0 && feedbackWithoutRating === 0 && missingConcernId === 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('   All concerns have been updated to the new schema.');
    } else {
      console.log('\n⚠️  Migration completed with warnings');
      console.log('   Some concerns may need manual review.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n📦 Disconnected from database');
  }
}

// Run migration
migrateConcerns().then(() => {
  console.log('✨ Migration script finished');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
