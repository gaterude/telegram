const { default: TelegramBot } = require("node-telegram-bot-api");
const env = require("../config/env");

const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN);

async function sendMessage(chatId, text, extra = {}) {
  return bot.sendMessage(chatId, text, extra);
}

async function processUpdate(update) {
  try {
    if (update.message) {
      await handleMessage(update.message);
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    }
  } catch (err) {
    console.error("Telegram update error:", err);
  }
}

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text || "";

  if (text === "/start") {
    await sendMessage(
      chatId,
      "Welcome! Use /help for commands."
    );
    return;
  }

  if (text === "/help") {
    await sendMessage(
      chatId,
      "Available commands:\n" +
      "/start - start the bot\n" +
      "/help - show this message\n" +
      "/echo <text> - echo back\n"
    );
    return;
  }

  if (text.startsWith("/echo ")) {
    await sendMessage(chatId, text.slice(6));
    return;
  }

  await sendMessage(chatId, `You said: ${text}`);
}

async function handleCallbackQuery(query) {
  // Reserved for Day 2 (Inline Keyboards)
}

module.exports = {
  bot,
  sendMessage,
  processUpdate
};