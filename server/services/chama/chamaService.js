// server/services/chama/chamaService.js
const repo = require("./chamaRepo");

async function create({ chatId, name, monthlyAmountCents, cycleDay, treasurerUserId }) {
  // Also opens the first cycle
  return repo.create({ chatId, name, monthlyAmountCents, cycleDay, treasurerUserId });
}

async function findByChatId(chatId) { return repo.findByChatId(chatId); }
async function findMember(chatId, userId) { return repo.findMember(chatId, userId); }
async function getMemberBalance(chatId, userId) {
  const member = await repo.findMember(chatId, userId);
  const totals = await repo.getMemberTotals(chatId, userId);
  return { ...member, ...totals };
}
async function getGroupStats(chatId) { return repo.getGroupStats(chatId); }
async function getMemberStatusList(chatId) { return repo.getMemberStatusList(chatId); }
// ...

module.exports = { create, findByChatId, findMember, getMemberBalance, getGroupStats, getMemberStatusList /* ... */ };