require("dotenv").config({ path: "../.env" });

console.log(
  "DATABASE_URL exists:",
  !!process.env.DATABASE_URL
);

const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

const telegram = require("./services/telegram.service");
const env = require("./config/env");

const {
  scheduleDailyReminder,
  scheduleOverdueReminder,
} = require("./services/reminder.service");

app.use(express.json());

app.use(
  "/telegram",
  require("./routes/telegram.routes")
);

const server = app.listen(
  PORT,
  () => {
    console.log(
      `Server is running on port ${PORT}`
    );

    // WEEK 20 ADDITION
    scheduleDailyReminder(
      telegram.bot,
      telegram.db
    );

    scheduleOverdueReminder(
      telegram.bot,
      telegram.db
    );
  }
);
require("./cron/registry").startAll();

// Configure Telegram webhook
(async () => {
  try {
    if (env.PUBLIC_URL) {
      const webhookUrl =
        `${env.PUBLIC_URL}/telegram/webhook`;

      console.log(
        "Registering webhook at:",
        webhookUrl
      );

      // DAY 3 ADDITION:
      // Subscribe to group membership updates
      await telegram.bot.setWebHook(
        webhookUrl,
        {
          allowed_updates: [
            "message",
            "callback_query",
            "chat_member",
            "my_chat_member",
          ],
        }
      );

      console.log(
        "✓ Webhook registered"
      );

      console.log(
        "Bot is ready to receive webhook updates"
      );
    } else {
      console.log(
        "No PUBLIC_URL set."
      );

      console.log(
        "Webhook not configured."
      );
    }
  } catch (err) {
    console.error(
      "Failed to configure Telegram:",
      err.message
    );
  }
})();

// Graceful shutdown
process.once(
  "SIGINT",
  () => {
    console.log(
      "Shutting down..."
    );

    telegram.bot.stopPolling();

    server.close();
  }
);

process.once(
  "SIGTERM",
  () => {
    console.log(
      "Shutting down..."
    );

    telegram.bot.stopPolling();

    server.close();
  }
);