const cron = require("node-cron");
const { db } = require("../services/telegram.service");
const { withLock } = require("../lib/pg-lock");
const { logJob } = require("../lib/job-logger");

async function processAll() {
  let lastId = 0;

  while (true) {
    const { rows } = await db.query(
      `SELECT id
       FROM telegram_chats
       WHERE id > $1
       ORDER BY id
       LIMIT 500`,
      [lastId]
    );

    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      console.log(`[process-pending] processing chat ${row.id}`);
    }

    lastId = rows[rows.length - 1].id;

    console.log(
      `[process-pending] processed chunk up to id ${lastId}`
    );
  }
}

cron.schedule("0 2 * * *", async () => {
  await withLock(42002, async () => {
    logJob("process-pending", "start");

    try {
      if (!db) {
        throw new Error("Database is not connected");
      }

      await processAll();

      logJob("process-pending", "success");
    } catch (err) {
      logJob("process-pending", "error", {
        error: err.message,
      });
    }
  });
}, {
  timezone: "Africa/Nairobi",
});

console.log("Process-pending job scheduled for 02:00 EAT");

module.exports = { processAll };