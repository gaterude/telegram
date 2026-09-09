const cron = require("node-cron");
const tasks = require("./tasks");
const telegram = require("../services/telegram.service");

const jobs = [
  {
    name: "cleanup-chats",
    schedule: "0 3 * * *",
    timezone: "Africa/Nairobi",
    run: tasks.cleanupChats,
  },
  {
    name: "daily-report",
    schedule: "*/3 * * * *",
    timezone: "Africa/Nairobi",
    run: tasks.sendDailyReport,
  },
  {
    name: "broadcast-cleanup",
    schedule: "0 4 * * *",
    timezone: "Africa/Nairobi",
    run: tasks.cleanupBroadcasts,
  },
  {
    name: "health-ping",
    schedule: "*/5 * * * *",
    timezone: "Africa/Nairobi",
    run: tasks.healthPing,
  },
  {
  name: "cleanup-old-members",
  schedule: "0 5 * * *",
  timezone: "Africa/Nairobi",
  run: tasks.cleanupOldMembers,
},
];

async function runJobWithLogging(job) {
  const { rows } = await telegram.db.query(
    `INSERT INTO cron_runs
      (job_name, status)
     VALUES ($1, 'running')
     RETURNING id`,
    [job.name]
  );

  const runId = rows[0].id;
  const start = Date.now();

  try {
    await job.run();

    const duration = Date.now() - start;

    await telegram.db.query(
      `UPDATE cron_runs
       SET finished_at = NOW(),
           status = 'success',
           duration_ms = $1
       WHERE id = $2`,
      [duration, runId]
    );

    console.log(
      `[cron] ${job.name} finished in ${duration}ms`
    );
  } catch (err) {
    const duration = Date.now() - start;

    await telegram.db.query(
      `UPDATE cron_runs
       SET finished_at = NOW(),
           status = 'failed',
           error_message = $1,
           duration_ms = $2
       WHERE id = $3`,
      [err.message, duration, runId]
    );

    console.error(
      `[cron] ${job.name} failed:`,
      err.message
    );
  }
}

function startAll() {
  for (const job of jobs) {
    cron.schedule(
      job.schedule,
      () => runJobWithLogging(job),
      {
        timezone: job.timezone,
      }
    );

    console.log(
      `[cron] Registered ${job.name}: ${job.schedule}`
    );
  }
}

module.exports = {
  startAll,
};