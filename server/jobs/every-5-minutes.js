const cron = require("node-cron");

cron.schedule("*/5 * * * *", () => {
  console.log("[every-5-minutes] running at", new Date().toISOString());
});

console.log("Every-5-minutes job scheduled");