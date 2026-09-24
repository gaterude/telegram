\# ADR 0001: Scheduler Choice



\## Status



Accepted



\## Context



The Telegram bot has several scheduled jobs such as the daily report, cleanup jobs and weekly jobs.



I needed to compare node-cron, pg\_cron and BullMQ and decide which one fits the current project.



\## Decision



I will continue using node-cron for the current Telegram bot.



The scheduled jobs are already running inside the Node.js application and the project already has error handling, retries and overlap protection.



I will not move the jobs to pg\_cron at this stage because my local pg\_cron Docker setup did not work.



\## Consequences



\- The scheduler stays simple and does not require another queue system.

\- The jobs stop when the Node.js application stops.

\- Retry and overlap handling remains part of the application.

\- pg\_cron could be considered later for database-specific jobs.

\- BullMQ could be considered later if the project needs more background workers and queued jobs.

