import { WeeklyNeed } from "../models/weekly-need";

export async function cleanupOldDonatedNeeds() {
  try {
    const now = new Date();
    
    // Find all needs that are scheduled for deletion and the scheduled time has passed
    const result = await WeeklyNeed.deleteMany({
      scheduledForDeletion: { $lte: now },
      fullyDonated: true,
    });

    if (result.deletedCount > 0) {
      console.log(`[CLEANUP] Removed ${result.deletedCount} old donated needs`);
    }
  } catch (error) {
    console.error("[CLEANUP] Error cleaning up old donated needs:", error);
  }
}

// Start cleanup job that runs every hour
export function startCleanupJob() {
  setInterval(cleanupOldDonatedNeeds, 60 * 60 * 1000); // Run every hour
  console.log("[CLEANUP] Started automatic cleanup job");
}
