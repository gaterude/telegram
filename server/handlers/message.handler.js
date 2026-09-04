const {
  getSession,
  setSession,
} = require("../services/session.service");

const {
  confirmContribution,
} = require("./callback.handler");

// DAY 3 ADDITION
const {
  getClient,
} = require("../config/redis");


// ==========================================
// DAY 3 ADDITION
// REDIS ANTI-SPAM COUNTER
// ==========================================

async function incrementMessageCount(
  chatId,
  userId
) {
  const client =
    await getClient();

  const key =
    `telegram:spam:${chatId}:${userId}`;

  const count =
    await client.incr(key);

  // First message starts
  // the 60-second window
  if (count === 1) {
    await client.expire(
      key,
      60
    );
  }

  return count;
}


// ==========================================
// EXISTING MESSAGE HANDLER
// ==========================================

async function handleMessage(
  bot,
  message
) {
  const chatId =
    message.chat.id;

  const userId =
    message.from.id;

  const text =
    message.text || "";


  // ==========================================
  // DAY 3 ADDITION
  // ANTI-SPAM
  // ==========================================

  if (
    message.chat.type === "group" ||
    message.chat.type === "supergroup"
  ) {
    try {
      const count =
        await incrementMessageCount(
          chatId,
          userId
        );

      console.log(
        `Spam counter ${userId}: ${count}`
      );

      if (count > 10) {
        await bot.restrictChatMember(
          chatId,
          userId,
          {
            permissions: {
              can_send_messages: false,
            },

            until_date:
              Math.floor(
                Date.now() / 1000
              ) + 300,
          }
        );

        await bot.sendMessage(
          chatId,
          `${message.from.first_name || "Member"} is posting too fast. Muted for 5 minutes.`
        );

        return;
      }
    } catch (err) {
      console.error(
        "Anti-spam error:",
        err.message
      );
    }
  }


  // ==========================================
  // EXISTING STATE:
  // CUSTOM CONTRIBUTION AMOUNT
  // ==========================================

  const session =
    await getSession(
      chatId,
      userId
    );


  if (
    session.state ===
    "awaiting_custom_amount"
  ) {
    const amount =
      parseInt(
        text,
        10
      );

    if (
      isNaN(amount) ||
      amount <= 0
    ) {
      await bot.sendMessage(
        chatId,
        "Please type a number greater than 0."
      );

      return;
    }

    await confirmContribution(
      bot,
      chatId,
      userId,
      amount
    );

    return;
  }


  // ==========================================
  // EXISTING COMMAND PARSING
  // ==========================================

  if (
    text === "/start"
  ) {
    await bot.sendMessage(
      chatId,
      "Welcome! Use /help for commands."
    );

    return;
  }


  if (
    text === "/help"
  ) {
    await bot.sendMessage(
      chatId,
      "Available commands:\n" +
        "/start - start the bot\n" +
        "/help - show this message\n" +
        "/echo <text> - echo back\n"
    );

    return;
  }


  if (
    text.startsWith("/echo ")
  ) {
    await bot.sendMessage(
      chatId,
      text.slice(6)
    );

    return;
  }


  // ==========================================
  // EXISTING DEFAULT RESPONSE
  // ==========================================

  await bot.sendMessage(
    chatId,
    `You said: ${text}`
  );
}


module.exports = {
  handleMessage,
};