const { db } = require("../services/telegram.service");

async function withLock(key, fn) {
  if (!db) {
    throw new Error("Database is not connected");
  }

  const { rows } = await db.query(
    "SELECT pg_try_advisory_lock($1) AS ok",
    [key]
  );

  if (!rows[0].ok) {
    console.log(`[lock] ${key} held by another instance, skipping`);
    return;
  }

  try {
    return await fn();
  } finally {
    await db.query(
      "SELECT pg_advisory_unlock($1)",
      [key]
    );
  }
}

module.exports = { withLock };