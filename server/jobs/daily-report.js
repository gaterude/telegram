const cron = require("node-cron");
const { db } = require("../services/telegram.service");

cron.schedule("0 8 * * *", async () => {
  console.log("[daily-report] running at", new Date().toISOString());

  if (!db) {
    console.log("[daily-report] Database is not connected");
    return;
  }

  try {
    const { rows } = await db.query(
      "SELECT COUNT(*) as n FROM telegram_chats WHERE last_active_at > NOW() - INTERVAL '1 day'"
    );

    console.log(`[daily-report] Active chats in last 24h: ${rows[0].n}`);
  } catch (err) {
    console.error("[daily-report] Error:", err.message);
  }
}, {
  timezone: "Africa/Nairobi"
});

console.log("Daily report scheduled for 08:00 EAT");