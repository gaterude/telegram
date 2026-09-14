const cron = require("node-cron");

cron.schedule("0 * * * *", () => {
  console.log("[hourly-cleanup] running at", new Date().toISOString());
});

console.log("Hourly cleanup scheduled");