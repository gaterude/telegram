const cron = require("node-cron");
const { logJob } = require("../lib/job-logger");

cron.schedule("0 9 * * 1", async () => {
  logJob("weekly-report", "start");

  try {
    console.log("[weekly-report] running at", new Date().toISOString());

    logJob("weekly-report", "success");
  } catch (err) {
    logJob("weekly-report", "error", {
      error: err.message,
    });
  }
});

console.log("Weekly report scheduled for Monday at 09:00");