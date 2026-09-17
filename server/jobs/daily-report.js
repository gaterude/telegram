const cron = require("node-cron");
const { db } = require("../services/telegram.service");
const { retry } = require("../lib/retry");
const { logJob } = require("../lib/job-logger");
const { withLock } = require("../lib/pg-lock");

cron.schedule("0 8 * * *", async () => {
  await withLock(42001, async () => {
    logJob("daily-report", "start");
    
    try {
      if (!db) {
        throw new Error("Database is not connected");
      }

      const { rows } = await retry(
        () =>
          db.query(
            "SELECT COUNT(*) as n FROM telegram_chats WHERE last_active_at > NOW() - INTERVAL '1 day'"
          ),
        {
          attempts: 3,
          baseMs: 500,
        }
      );

      logJob("daily-report", "success", {
        active_chats: rows[0].n,
      });
    } catch (err) {
      logJob("daily-report", "error", {
        error: err.message,
      });
    }
  });
}, {
  timezone: "Africa/Nairobi",
});

console.log("Daily report scheduled for 08:00 EAT");