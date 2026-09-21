module.exports = async function members(bot, message) {
  const chatId = message.chat.id;
  const userId = message.from.id;

  const chama = await chamaService.findByChatId(chatId);
  if (!chama || chama.treasurer_user_id !== userId) {
    return bot.sendMessage(chatId, "Only the treasurer can run /members.");
  }

  const list = await chamaService.getMemberStatusList(chatId);
  const lines = list.map((m) => {
    const icon = m.contributedThisCycle >= chama.monthly_amount_cents ? "OK" : "MISSING";
    return `${icon} ${m.name}: KSh ${(m.contributedThisCycle / 100).toLocaleString()}`;
  });

  // Reply in private to the treasurer, not in the group.
  await bot.sendMessage(userId, `Members status:\n${lines.join("\n")}`);
};