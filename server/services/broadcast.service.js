const { bot, db } = require("./telegram.service");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function broadcast(text, { rateMs = 50 } = {}) {
  if (!db) {
    throw new Error("Database is not connected");
  }

  // Create broadcast record
  const broadcastResult = await db.query(
    `INSERT INTO broadcasts (text)
     VALUES ($1)
     RETURNING id`,
    [text]
  );

  const broadcastId = broadcastResult.rows[0].id;

  // Get every group and supergroup
  const { rows } = await db.query(
    `SELECT id
     FROM telegram_chats
     WHERE type IN ('group', 'supergroup')
     ORDER BY id`
  );

  let sent = 0;
  let failed = 0;

  for (const chat of rows) {
    // Check whether this broadcast was already sent
    const deliveryResult = await db.query(
      `SELECT status
       FROM broadcast_deliveries
       WHERE broadcast_id = $1
       AND chat_id = $2`,
      [broadcastId, chat.id]
    );

    if (
      deliveryResult.rows.length > 0 &&
      deliveryResult.rows[0].status === "sent"
    ) {
      continue;
    }

    // Create delivery record if it doesn't exist
    await db.query(
      `INSERT INTO broadcast_deliveries
       (broadcast_id, chat_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (broadcast_id, chat_id)
       DO NOTHING`,
      [broadcastId, chat.id, "pending"]
    );

    try {
      await bot.sendMessage(
        chat.id,
        text,
        {
          parse_mode: "HTML",
        }
      );

      await db.query(
        `UPDATE broadcast_deliveries
         SET sent_at = NOW(),
             status = 'sent'
         WHERE broadcast_id = $1
         AND chat_id = $2`,
        [broadcastId, chat.id]
      );

      sent++;
    } catch (err) {
      const errorCode =
        err.response?.body?.error_code;

      // Bot was removed from group
      if (errorCode === 403) {
        console.error(
          `Bot is no longer in chat ${chat.id}. Removing stale chat.`
        );

        await db.query(
          `DELETE FROM telegram_chats
           WHERE id = $1`,
          [chat.id]
        );

        await db.query(
          `UPDATE broadcast_deliveries
           SET status = 'failed'
           WHERE broadcast_id = $1
           AND chat_id = $2`,
          [broadcastId, chat.id]
        );

        failed++;
      }

      // Telegram rate limit
      else if (errorCode === 429) {
        const retryAfter =
          (err.response?.body?.parameters?.retry_after || 1) *
          1000;

        console.log(
          `Rate limited. Waiting ${retryAfter}ms before retry.`
        );

        await sleep(retryAfter);

        try {
          await bot.sendMessage(
            chat.id,
            text,
            {
              parse_mode: "HTML",
            }
          );

          await db.query(
            `UPDATE broadcast_deliveries
             SET sent_at = NOW(),
                 status = 'sent'
             WHERE broadcast_id = $1
             AND chat_id = $2`,
            [broadcastId, chat.id]
          );

          sent++;
        } catch (retryErr) {
          console.error(
            `Retry failed for ${chat.id}:`,
            retryErr.message
          );

          await db.query(
            `UPDATE broadcast_deliveries
             SET status = 'failed'
             WHERE broadcast_id = $1
             AND chat_id = $2`,
            [broadcastId, chat.id]
          );

          failed++;
        }
      }

      // Other errors
      else {
        console.error(
          `Broadcast failed for ${chat.id}:`,
          err.message
        );

        await db.query(
          `UPDATE broadcast_deliveries
           SET status = 'failed'
           WHERE broadcast_id = $1
           AND chat_id = $2`,
          [broadcastId, chat.id]
        );

        failed++;
      }
    }

    await sleep(rateMs);
  }

  await db.query(
    `UPDATE broadcasts
     SET completed_at = NOW()
     WHERE id = $1`,
    [broadcastId]
  );

  return {
    broadcastId,
    sent,
    failed,
  };
}

module.exports = {
  broadcast,
};