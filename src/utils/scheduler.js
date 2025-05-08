import { getDb } from '../config/database.js';

// Check for expired capsules and mark them
export const checkExpiredCapsules = async () => {
  try {
    const db = await getDb();
    
    // Find capsules that are more than 30 days past their unlock time and not already marked as expired
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await db.run(`
      UPDATE capsules
      SET is_expired = 1
      WHERE unlock_at < datetime(?, 'unixepoch')
      AND is_expired = 0
    `, [Math.floor(thirtyDaysAgo.getTime() / 1000)]);
    
    console.log(`Marked ${result.changes} capsules as expired`);
    
    await db.close();
  } catch (error) {
    console.error('Error checking for expired capsules:', error);
  }
};

// Initialize the scheduler to run every hour
export const initScheduler = () => {
  // Run immediately on startup
  checkExpiredCapsules();
  
  // Then run every hour
  setInterval(checkExpiredCapsules, 60 * 60 * 1000);
  
  console.log('Expiration scheduler initialized');
};