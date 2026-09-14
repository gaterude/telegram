# Startup Notes

It is dangerous to assume that a scheduled job will automatically run the last missed iteration when the server starts. If the server crashes and restarts at 08:01, a node-cron job scheduled for 08:00 will not run at 08:01; it will wait for the next scheduled time. If the job needs catch-up logic, the application can store the last successful run time and check on startup whether a scheduled run was missed, then run it if necessary.
