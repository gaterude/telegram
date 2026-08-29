const { default: TelegramBot } = require("node-telegram-bot-api");
const { Client } = require("pg");
const env = require("../config/env");

const { handleMessage } = require("../handlers/message.handler");
const { handleCallbackQuery } = require("../handlers/callback.handler");

const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, {
  polling: false,
});

// Database connection
let db = null;

if (process.env.DATABASE_URL) {
  db = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  db.connect().catch((err) => {
    console.error("Database connection error:", err.message);
    db = null;
  });
}

// Save chat to database
async function saveChat(chat) {
  if (!db) return;

  try {
    await db.query(
      `INSERT INTO telegram_chats (id, type, title, username, last_active_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (id) DO UPDATE SET last_active_at = NOW()`,
      [chat.id, chat.type, chat.title || null, chat.username || null]
    );
  } catch (err) {
    console.error("Error saving chat:", err.message);
  }
}

// Main menu
const mainMenu = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "Contribute", callback_data: "contribute" }],
      [{ text: "My balance", callback_data: "balance" }],
      [{ text: "Group stats", callback_data: "stats" }],
    ],
  },
};

// /start
bot.onText(/^\/start(?:\s+.*)?$/, async (msg) => {
  console.log("User started bot:", msg.from.id);

  await saveChat(msg.chat);

  await bot.sendMessage(
    msg.chat.id,
    "Welcome to Chama Bot! What would you like to do?",
    mainMenu
  );
});

// /help
bot.onText(/^\/help$/, async (msg) => {
  console.log("User requested help:", msg.from.id);

  await saveChat(msg.chat);

  await bot.sendMessage(
    msg.chat.id,
    "Available commands:\n" +
      "/start - start the bot\n" +
      "/help - show this message\n" +
      "/echo <text> - echo back\n"
  );
});

// /echo
bot.onText(/^\/echo(?:\s+(.+))?$/s, async (msg, match) => {
  const text = match && match[1] ? match[1].trim() : "";

  await saveChat(msg.chat);

  if (!text) {
    await bot.sendMessage(msg.chat.id, "Usage: /echo <text>");
    return;
  }

  console.log("Echo command:", text);

  await bot.sendMessage(msg.chat.id, text);
});

// Normal messages
bot.on("message", async (msg) => {
  // Commands are handled above.
  if (msg.text && msg.text.startsWith("/")) {
    return;
  }

  console.log(
    "Received message:",
    msg.text,
    "from",
    msg.from.id
  );

  await saveChat(msg.chat);

  try {
    await handleMessage(bot, msg);
  } catch (err) {
    console.error("Message handler error:", err);
  }
});

// Callback queries
bot.on("callback_query", async (callbackQuery) => {
  console.log(
    "CALLBACK QUERY RECEIVED:",
    callbackQuery.data,
    "from",
    callbackQuery.from.id
  );

  try {
    await handleCallbackQuery(bot, callbackQuery, db);

    console.log("✓ Callback handled successfully");

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error(" Callback handler error:", err.message);

    try {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Error processing request",
        show_alert: true,
      });
    } catch (e) {}
  }
});

// Send message
async function sendMessage(chatId, text, extra = {}) {
  return bot.sendMessage(chatId, text, extra);
}

// Process webhook update
async function processUpdate(update) {
  try {
    await bot.processUpdate(update);
  } catch (err) {
    console.error("Update error:", err);
  }
}

module.exports = {
  bot,
  db,
  sendMessage,
  processUpdate,
  saveChat,
};
