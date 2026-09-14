# Timezone Notes

Node-cron uses the server's timezone by default if no timezone is provided.

I use `timezone: "Africa/Nairobi"` so that the scheduled jobs follow Kenya time instead of depending on where the server is running.

For example, `0 8 * * *` means 8:00 AM. If the server is using UTC and no timezone is specified, the job would run at 8:00 AM UTC, which is 11:00 AM in Kenya.

Kenya does not use daylight saving time, so the Africa/Nairobi timezone stays at UTC+3 throughout the year.
