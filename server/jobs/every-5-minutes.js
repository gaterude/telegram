const cron = require("node-cron");
const { logJob } = require("../lib/job-logger");

let running = false;

cron.schedule("*/5 * * * *", async () => {
  if (running) {
    logJob("every-5-minutes", "skipped", {
      reason: "previous run still running",
    });
    return;
  }

  running = true;
  logJob("every-5-minutes", "start");

  try {
    console.log("[every-5-minutes] running at", new Date().toISOString());

    await new Promise((resolve) => setTimeout(resolve, 6000));

    logJob("every-5-minutes", "success");
  } catch (err) {
    logJob("every-5-minutes", "error", {
      error: err.message,
    });
  } finally {
    running = false;
  }
});

console.log("Every-5-minutes job scheduled");