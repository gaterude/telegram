const { TelegramBot } = require("node-telegram-bot-api");

const { Client } = require("pg");

const env = require("../config/env");

const {
  handleMessage,
} = require("../handlers/message.handler");

const {
  handleCallbackQuery,
} = require("../handlers/callback.handler");

// DAY 3 ADDITION
const {
  handleChatMemberUpdate,
  handleBotMembershipUpdate,
} = require("../handlers/chatMember.handler");

const bot = new TelegramBot(
  env.TELEGRAM_BOT_TOKEN,
  {
    polling: false,
  }
);

// Database connection

let db = null;

if (process.env.DATABASE_URL) {
  console.log("Creating PostgreSQL connection...");

  db = new Client({
    connectionString:
      process.env.DATABASE_URL,
  });

  db.connect()
    .then(() => {
      console.log("PostgreSQL connected successfully");
    })
    .catch((err) => {
      console.error(
        "Database connection error:",
        err.message
      );
      db = null;
    });
} else {
  console.error(
    "DATABASE_URL is not available."
  );
}

// Save chat to database

async function saveChat(chat) {
  if (!db) return;

  try {
    await db.query(
      `INSERT INTO telegram_chats
       (id, type, title, username, last_active_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (id)
       DO UPDATE SET last_active_at = NOW()`,
      [
        chat.id,
        chat.type,
        chat.title || null,
        chat.username || null,
      ]
    );
  } catch (err) {
    console.error(
      "Error saving chat:",
      err.message
    );
  }
}

// WEEK 20 ADDITION
// Save Telegram subscriber

async function saveSubscriber(user) {
  if (!db) return;

  try {
    await db.query(
      `INSERT INTO telegram_subscribers
       (chat_id, first_name, username, blocked)
       VALUES ($1, $2, $3, FALSE)
       ON CONFLICT (chat_id)
       DO UPDATE SET
         first_name = EXCLUDED.first_name,
         username = EXCLUDED.username,
         blocked = FALSE,
         updated_at = NOW()`,
      [
        user.id,
        user.first_name || null,
        user.username || null,
      ]
    );

    console.log(
      `Subscriber saved: ${user.id}`
    );
  } catch (err) {
    console.error(
      "Error saving subscriber:",
      err.message
    );
  }
}

// Main menu

const mainMenu = {
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: "Contribute",
          callback_data: "contribute",
        },
      ],
      [
        {
          text: "My balance",
          callback_data: "balance",
        },
      ],
      [
        {
          text: "Group stats",
          callback_data: "stats",
        },
      ],
    ],
  },
};

// /start

bot.onText(
  /^\/start(?:\s+.*)?$/,
  async (msg) => {
    console.log(
      "User started bot:",
      msg.from.id
    );

    await saveChat(msg.chat);

    // WEEK 20 ADDITION
    // Save user as an active subscriber
    await saveSubscriber(msg.from);

    await bot.sendMessage(
      msg.chat.id,
      "Welcome to Chama Bot! What would you like to do?",
      mainMenu
    );
  }
);

// /stop

bot.onText(
  /^\/stop$/,
  async (msg) => {
    console.log(
      "User stopped bot:",
      msg.from.id
    );

    if (!db) {
      await bot.sendMessage(
        msg.chat.id,
        "Database is not connected."
      );

      return;
    }

    try {
      await db.query(
        `UPDATE telegram_subscribers
         SET blocked = TRUE,
             updated_at = NOW()
         WHERE chat_id = $1`,
        [msg.from.id]
      );

      await bot.sendMessage(
        msg.chat.id,
        "You have been unsubscribed from broadcasts."
      );
    } catch (err) {
      console.error(
        "Error stopping subscriber:",
        err.message
      );

      await bot.sendMessage(
        msg.chat.id,
        "Could not stop broadcasts."
      );
    }
  }
);

// /help

bot.onText(
  /^\/help$/,
  async (msg) => {
    console.log(
      "User requested help:",
      msg.from.id
    );

    await saveChat(msg.chat);

    await bot.sendMessage(
      msg.chat.id,
      "Available commands:\n" +
        "/start - start the bot\n" +
        "/stop - stop broadcasts\n" +
        "/help - show this message\n" +
        "/echo <text> - echo back\n"
    );
  }
);

// /echo

bot.onText(
  /^\/echo(?:\s+(.+))?$/s,
  async (msg, match) => {
    const text =
      match && match[1]
        ? match[1].trim()
        : "";

    await saveChat(msg.chat);

    if (!text) {
      await bot.sendMessage(
        msg.chat.id,
        "Usage: /echo <text>"
      );

      return;
    }

    console.log(
      "Echo command:",
      text
    );

    await bot.sendMessage(
      msg.chat.id,
      text
    );
  }
);

// ==========================================
// DAY 3 ADDITION
// GROUP ADMIN CHECK
// ==========================================

async function isGroupAdmin(
  chatId,
  userId
) {
  try {
    const member =
      await bot.getChatMember(
        chatId,
        userId
      );

    return (
      member.status === "creator" ||
      member.status === "administrator"
    );
  } catch (err) {
    console.error(
      "Admin check error:",
      err.message
    );

    return false;
  }
}

// ==========================================
// WEEK 20 ADDITION
// /broadcast COMMAND
// ==========================================

bot.onText(
  /^\/broadcast(?:\s+(.+))?$/s,
  async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    await saveChat(msg.chat);

    // Broadcast should only be used in a group
    // by an administrator.
    if (
      msg.chat.type !== "group" &&
      msg.chat.type !== "supergroup"
    ) {
      await bot.sendMessage(
        chatId,
        "/broadcast can only be used inside a group."
      );

      return;
    }

    // Check whether sender is admin
    if (
      !(await isGroupAdmin(
        chatId,
        userId
      ))
    ) {
      await bot.sendMessage(
        chatId,
        "Only group administrators can use /broadcast."
      );

      return;
    }

    const text =
      match && match[1]
        ? match[1].trim()
        : "";

    if (!text) {
      await bot.sendMessage(
        chatId,
        "Usage: /broadcast <message>"
      );

      return;
    }

    await bot.sendMessage(
      chatId,
      "Broadcast started."
    );

    try {
      const { broadcast } =
        require("./broadcast.service");

      const result =
        await broadcast(text);

      await bot.sendMessage(
        chatId,
        `Broadcast completed.\nSent: ${result.sent}\nFailed: ${result.failed}`
      );
    } catch (err) {
      console.error(
        "Broadcast command error:",
        err.message
      );

      await bot.sendMessage(
        chatId,
        "Broadcast failed."
      );
    }
  }
);

// ==========================================
// DAY 3 ADDITION
// /kick COMMAND
// ==========================================

bot.onText(
  /^\/kick$/,
  async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Only allow /kick in groups
    if (
      msg.chat.type !== "group" &&
      msg.chat.type !== "supergroup"
    ) {
      await bot.sendMessage(
        chatId,
        "/kick can only be used inside a group."
      );

      return;
    }

    // Must be a reply
    if (!msg.reply_to_message) {
      await bot.sendMessage(
        chatId,
        "Reply to a user's message with /kick."
      );

      return;
    }

    // Check whether sender is admin
    if (
      !(await isGroupAdmin(
        chatId,
        userId
      ))
    ) {
      await bot.sendMessage(
        chatId,
        "Only admins can kick members."
      );

      return;
    }

    const targetUser =
      msg.reply_to_message.from;

    // Don't allow admins to kick other admins
    if (
      await isGroupAdmin(
        chatId,
        targetUser.id
      )
    ) {
      await bot.sendMessage(
        chatId,
        "You cannot kick a group administrator."
      );

      return;
    }

    try {
      // Ban
      await bot.banChatMember(
        chatId,
        targetUser.id
      );

      // Immediately unban.
      // This makes it a kick instead of a permanent ban.
      await bot.unbanChatMember(
        chatId,
        targetUser.id
      );

      await bot.sendMessage(
        chatId,
        `${targetUser.first_name || "Member"} was kicked.`
      );

      console.log(
        `Kicked user ${targetUser.id} from group ${chatId}`
      );
    } catch (err) {
      console.error(
        "Kick error:",
        err.message
      );

      await bot.sendMessage(
        chatId,
        "I could not kick that member. Make sure I am an administrator with permission to manage members."
      );
    }
  }
);

// ==========================================
// EXISTING NORMAL MESSAGE HANDLER
// ==========================================

bot.on(
  "message",
  async (msg) => {
    // Commands are handled above.
    if (
      msg.text &&
      msg.text.startsWith("/")
    ) {
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
      await handleMessage(
        bot,
        msg
      );
    } catch (err) {
      console.error(
        "Message handler error:",
        err
      );
    }
  }
);

// ==========================================
// EXISTING CALLBACK QUERIES
// ==========================================

bot.on(
  "callback_query",
  async (callbackQuery) => {
    console.log(
      "CALLBACK QUERY RECEIVED:",
      callbackQuery.data,
      "from",
      callbackQuery.from.id
    );

    try {
      await handleCallbackQuery(
        bot,
        callbackQuery,
        db
      );

      console.log(
        "Callback handled successfully"
      );

      // The callback handler handles acknowledgement
      // for the Day 3 rules button and existing callbacks.
    } catch (err) {
      console.error(
        "Callback handler error:",
        err.message
      );

      try {
        await bot.answerCallbackQuery(
          callbackQuery.id,
          {
            text:
              "Error processing request",
            show_alert: true,
          }
        );
      } catch (e) {}
    }
  }
);

// ==========================================
// DAY 3 ADDITION
// CHAT MEMBER UPDATES
// ==========================================

bot.on(
  "chat_member",
  async (event) => {
    console.log(
      "CHAT MEMBER UPDATE:",
      event.chat.id,
      event.old_chat_member.status,
      "->",
      event.new_chat_member.status
    );

    try {
      await handleChatMemberUpdate(
        bot,
        event,
        db
      );
    } catch (err) {
      console.error(
        "Chat member handler error:",
        err.message
      );
    }
  }
);

// ==========================================
// DAY 3 ADDITION
// BOT MEMBERSHIP UPDATES
// ==========================================

bot.on(
  "my_chat_member",
  async (event) => {
    console.log(
      "MY CHAT MEMBER UPDATE:",
      event.chat.id,
      event.old_chat_member.status,
      "->",
      event.new_chat_member.status
    );

    try {
      await handleBotMembershipUpdate(
        bot,
        event
      );
    } catch (err) {
      console.error(
        "Bot membership handler error:",
        err.message
      );
    }
  }
);

// Send message

async function sendMessage(
  chatId,
  text,
  extra = {}
) {
  return bot.sendMessage(
    chatId,
    text,
    extra
  );
}

// Process webhook update

async function processUpdate(
  update
) {
  try {
    await bot.processUpdate(
      update
    );
  } catch (err) {
    console.error(
      "Update error:",
      err
    );
  }
}

module.exports = {
  bot,
  db,
  sendMessage,
  processUpdate,
  saveChat,
};