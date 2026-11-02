// lib/cron.ts
import cron from "node-cron";
import { checkAndCloseExpiredWagers } from "@/services/wagerService";
import pool from "@/lib/mysql";

// Run every minute
export function startCronJobs() {
  cron.schedule("* * * * *", async () => {
    console.log("Running wager expiry check...");
    await checkAndCloseExpiredWagers();
  });

  // Weekly leaderboard reset — every Monday at 00:00 WAT (Africa/Lagos)
  cron.schedule("0 0 * * 1", async () => {
    const startTime = new Date().toISOString();
    console.log(`[WeeklyReset] Starting at ${startTime}`);
    try {
      const [result]: any = await pool.query(
        `UPDATE users SET weeklyWinnings = 0, weeklyWagerCount = 0`
      );
      console.log(
        `[WeeklyReset] Completed at ${new Date().toISOString()} — ${result.affectedRows} rows reset`
      );
    } catch (err) {
      console.error("[WeeklyReset] Failed:", err);
      // swallow — do not crash the process
    }
  }, { timezone: "Africa/Lagos" });
}
