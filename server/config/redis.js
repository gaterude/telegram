const { createClient } = require("redis");

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const client = createClient({
  url: redisUrl,
});

client.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

let connected = false;

async function getClient() {
  if (!connected) {
    await client.connect();
    connected = true;
    console.log("Redis connected");
  }

  return client;
}

module.exports = {
  getClient,
};