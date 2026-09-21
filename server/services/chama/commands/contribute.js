// server/services/chama/commands/contribute.js
const chamaService = require("../chamaService");

module.exports = async function contribute(bot, message) {
  const chatId = message.chat.id;
  const userId = message.from.id;

  // Must be a group chat with a chama set up
  const chama = await chamaService.findByChatId(chatId);
  if (!chama) {
    return bot.sendMessage(chatId, "This group is not a chama. Run /setup first.");
  }
  const member = await chamaService.findMember(chatId, userId);
  if (!member) {
    return bot.sendMessage(chatId, "Run /join first.");
  }

  const cycle = await chamaService.getOpenCycle(chatId);
  if (!cycle) {
    return bot.sendMessage(chatId, "No open cycle. Ask the treasurer to run /open_cycle.");
  }

  const amountKsh = chama.monthly_amount_cents / 100;
  const periodLabel = new Date(cycle.period_start).toLocaleDateString("en-KE", { month: "long" });

  // Reply privately (do not spam the group with payment flows)
  await bot.sendMessage(userId,
    `Contribute for ${chama.name}:`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: `Contribute KSh ${amountKsh} for ${periodLabel}`, callback_data: `cntb:${cycle.id}:${chama.monthly_amount_cents}` }],
          [{ text: "Custom amount", callback_data: `cntb:${cycle.id}:custom` }],
          [{ text: "Cancel", callback_data: "cntb:cancel" }],
        ],
      },
    }
  );
};
async function initiateContribution(bot, query, cycleId, amountCents) {
  const userId = query.from.id;
  const chatId = query.message.chat.id;

  // Edit the original message to show processing state
  await bot.editMessageText("Initiating M-Pesa prompt...", {
    chat_id: chatId,
    message_id: query.message.message_id,
  });

  try {
    const result = await chamaService.initiateContribution({
      userId,
      cycleId,
      amountCents,
    });

    await bot.editMessageText(
      `Check your phone for the M-Pesa prompt.\n` +
      `Contribution id: ${result.contributionId.slice(0, 8)}\n` +
      `Enter your PIN to complete.`,
      { chat_id: chatId, message_id: query.message.message_id }
    );
  } catch (err) {
    console.error("Initiate contribution failed:", err);
    await bot.editMessageText(
      "Could not start M-Pesa payment. Please try again.",
      { chat_id: chatId, message_id: query.message.message_id }
    );
  }
}