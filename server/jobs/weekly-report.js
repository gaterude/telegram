const cron = require("node-cron");

cron.schedule("0 9 * * 1", () => {
  console.log("[weekly-report] running at", new Date().toISOString());
});

console.log("Weekly report scheduled for Monday at 09:00");