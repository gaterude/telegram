require("dotenv").config({ path: "../.env" });

const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

const telegram = require("./services/telegram.service");
const env = require("./config/env");

app.use(express.json());

app.use("/telegram", require("./routes/telegram.routes"));

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Configure Telegram webhook
(async () => {
  try {
    if (env.PUBLIC_URL) {
      const webhookUrl = `${env.PUBLIC_URL}/telegram/webhook`;

      console.log("Registering webhook at:", webhookUrl);

      await telegram.bot.setWebHook(webhookUrl);

      console.log("✓ Webhook registered");
      console.log("Bot is ready to receive webhook updates");
    } else {
      console.log("No PUBLIC_URL set.");
      console.log("Webhook not configured.");
    }
  } catch (err) {
    console.error("Failed to configure Telegram:", err.message);
  }
})();

// Graceful shutdown
process.once("SIGINT", () => {
  console.log("Shutting down...");

  telegram.bot.stopPolling();

  server.close();
});

process.once("SIGTERM", () => {
  console.log("Shutting down...");

  telegram.bot.stopPolling();

  server.close();
});