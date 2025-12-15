// Script to initialize user points for existing users
const UserPoints = require('../models/UserPoints');
const User = require('../models/User');

const initializeAllUserPoints = async () => {
  try {
    console.log('🚀 Starting user points initialization...');
    
    // Get all users
    const result = await User.getAllUsersWithDetails(1000, 0); // Get up to 1000 users
    const users = result.users || [];
    console.log(`📊 Found ${users.length} users`);
    
    let initialized = 0;
    let skipped = 0;
    
    for (const user of users) {
      try {
        // Check if user already has points
        const existingPoints = await UserPoints.getUserPoints(user.id);
        
        if (!existingPoints || existingPoints.total_points === undefined) {
          // Initialize points for this user
          await UserPoints.initializeUserPoints(user.id);
          initialized++;
          console.log(`✅ Initialized points for user ${user.id} (${user.name})`);
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`❌ Failed to initialize points for user ${user.id}:`, error);
      }
    }
    
    console.log(`🎉 Initialization complete!`);
    console.log(`✅ Initialized: ${initialized} users`);
    console.log(`⏭️ Skipped (already had points): ${skipped} users`);
    
  } catch (error) {
    console.error('❌ Failed to initialize user points:', error);
  }
};

// Run if called directly
if (require.main === module) {
  initializeAllUserPoints().then(() => {
    console.log('Script completed');
    process.exit(0);
  }).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = { initializeAllUserPoints };