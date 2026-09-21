// server/workers/outbox.js (extended)
const chamaService = require("../services/chama/chamaService");
const telegramService = require("../services/telegram.service");

async function processOutboxRow(row) {
  if (row.event_type === "order.paid") {
    const orderId = row.payload.orderId;
    // Is this a chama contribution?
    const contribution = await query(
      "SELECT id, chama_id, member_user_id, amount_cents FROM contributions WHERE id = $1",
      [orderId]
    );
    if (contribution.rows[0]) {
      const c = contribution.rows[0];
      await chamaService.confirmContribution(c.id);
      await telegramService.sendMessage(c.chama_id,
        `${await memberName(c.chama_id, c.member_user_id)} just contributed KSh ${(c.amount_cents / 100).toLocaleString()}!`
      );
      // Also update the "cycle progress" status
      const stats = await chamaService.getGroupStats(c.chama_id);
      await telegramService.sendMessage(c.chama_id,
        `Cycle progress: KSh ${(stats.collectedThisCycle / 100).toLocaleString()} / ${(stats.expectedThisCycle / 100).toLocaleString()}`
      );
    } else {
      // Must be a shop order, not a chama contribution
      // ... existing shop confirmation logic
    }
  }
}
async function confirmContribution(contributionId) {
  // Atomic: only confirm if still pending
  const result = await query(
    `UPDATE contributions
     SET status = 'confirmed', confirmed_at = NOW()
     WHERE id = $1 AND status = 'pending'
     RETURNING id`,
    [contributionId]
  );
  return result.rowCount > 0;
}
if (row.event_type === "order.failed" || row.event_type === "order.cancelled") {
  const contribution = // look up
  if (contribution) {
    await query("UPDATE contributions SET status = 'failed' WHERE id = $1", [contribution.id]);
    await telegramService.sendMessage(contribution.member_user_id,
      "Your contribution did not go through. Try again with /contribute."
    );
    // Do NOT announce in the group -- failures are private
  }
}