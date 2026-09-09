const telegram = require("../services/telegram.service");
const env = require("../config/env");

async function cleanupChats() {
  if (!telegram.db) {
    throw new Error("PostgreSQL database is not connected");
  }

  const result = await telegram.db.query(
    `DELETE FROM telegram_chats
     WHERE last_active_at < NOW() - INTERVAL '30 days'
       AND type = 'private'`
  );

  console.log(
    `[cron] Deleted ${result.rowCount} inactive private chats`
  );
}

async function sendDailyReport() {
  if (!telegram.db) {
    throw new Error("PostgreSQL database is not connected");
  }

  const { rows } = await telegram.db.query(
    `SELECT
       COUNT(*)::int AS total_chats,
       COUNT(*) FILTER (
         WHERE type = 'group'
            OR type = 'supergroup'
       )::int AS groups,
       COUNT(*) FILTER (
         WHERE last_active_at >= NOW() - INTERVAL '1 day'
       )::int AS active_chats
     FROM telegram_chats`
  );

  const r = rows[0];

  const message =
    `Daily Telegram Bot Report:\n` +
    `Total chats: ${r.total_chats}\n` +
    `Groups: ${r.groups}\n` +
    `Active in last 24h: ${r.active_chats}`;

  if (env.ADMIN_CHAT_ID) {
    await telegram.bot.sendMessage(
      env.ADMIN_CHAT_ID,
      message
    );
  }
}

async function cleanupBroadcasts() {
  if (!telegram.db) {
    throw new Error("PostgreSQL database is not connected");
  }

  const result = await telegram.db.query(
    `DELETE FROM broadcasts
     WHERE completed_at IS NOT NULL
       AND completed_at < NOW() - INTERVAL '30 days'`
  );

  console.log(
    `[cron] Deleted ${result.rowCount} old broadcasts`
  );
}

async function healthPing() {
  try {
    await telegram.bot.getMe();

    console.log(
      "[cron] Telegram API health check passed"
    );
  } catch (err) {
    console.warn(
      "[cron] Telegram API health check failed:",
      err.message
    );

    throw err;
  }
}

async function cleanupOldMembers() {
  if (!telegram.db) {
    throw new Error("PostgreSQL database is not connected");
  }

  const result = await telegram.db.query(
    `DELETE FROM group_members
     WHERE left_at IS NOT NULL
       AND left_at < NOW() - INTERVAL '30 days'`
  );

  console.log(
    `[cron] Deleted ${result.rowCount} old group members`
  );
}

module.exports = {
  cleanupChats,
  sendDailyReport,
  cleanupBroadcasts,
  healthPing,
  cleanupOldMembers,
};