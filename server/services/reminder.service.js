const cron = require("node-cron");

// ─── Daily group reminder ───────────────────────────────────────────────────

function scheduleDailyReminder(bot, db) {
  cron.schedule(
    "0 8 * * *",
    async () => {
      console.log("Running daily chama reminder");

      try {
        const { rows } = await db.query(
          `SELECT chat_id FROM group_settings`
        );

        for (const row of rows) {
          try {
            await bot.sendMessage(
              row.chat_id,
              "Good morning! Reminder: log today's contribution with /contribute"
            );
          } catch (err) {
            console.error(
              `Daily reminder send failed for chat ${row.chat_id}:`,
              err.message
            );
          }

          await new Promise((r) => setTimeout(r, 50));
        }
      } catch (err) {
        console.error(
          "Daily reminder job failed:",
          err.message
        );
      }
    },
    {
      timezone: "Africa/Nairobi",
    }
  );

  console.log(
    "Daily reminder cron scheduled (08:00 Africa/Nairobi)"
  );
}

// ─── 7-day-overdue personal reminder ────────────────────────────────────────

function scheduleOverdueReminder(bot, db) {
  cron.schedule(
    "0 18 * * *",
    async () => {
      console.log(
        "Running 7-day overdue contribution reminder"
      );

      try {
        const { rows } = await db.query(
          `SELECT chat_id, user_id, first_name
           FROM group_members
           WHERE left_at IS NULL`
        );

        for (const row of rows) {
          try {
            // Try private message first
            await bot.sendMessage(
              row.user_id,
              `Hi ${row.first_name}, friendly reminder that your chama contribution is overdue.`
            );

            console.log(
              `Private overdue reminder sent to ${row.user_id}`
            );
          } catch (err) {
            const errorCode =
              err.response?.statusCode ||
              err.response?.body?.error_code;

            if (errorCode === 403) {
              // User hasn't started a private chat with the bot.
              // Fall back to mentioning them in the group.
              try {
                await bot.sendMessage(
                  row.chat_id,
                  `<a href="tg://user?id=${row.user_id}">${row.first_name}</a>, your contribution is overdue.`,
                  { parse_mode: "HTML" }
                );

                console.log(
                  `Group overdue reminder sent for user ${row.user_id}`
                );
              } catch (groupErr) {
                console.error(
                  `Overdue reminder group fallback failed for user ${row.user_id}:`,
                  groupErr.message
                );
              }
            } else {
              console.error(
                `Overdue reminder failed for user ${row.user_id}:`,
                err.message
              );
            }
          }

          await new Promise((r) => setTimeout(r, 100));
        }
      } catch (err) {
        console.error(
          "Overdue reminder job failed:",
          err.message
        );
      }
    },
    {
      timezone: "Africa/Nairobi",
    }
  );

  console.log(
    "Overdue reminder cron scheduled (TEST: every minute)"
  );
}

// ─── Export ─────────────────────────────────────────────────────────────────

module.exports = {
  scheduleDailyReminder,
  scheduleOverdueReminder,
};