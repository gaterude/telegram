# Idempotency Notes

## What does "idempotent" mean for a cron job?

An idempotent cron job can run more than once without causing an unwanted extra effect. Running it once or multiple times should leave the system in the same correct state.

## If daily-report runs twice at 08:00 because of a retry, does it matter? Why?

It should not matter because the daily report only reads data from the database and counts active chats. It does not change the data, so running the query again does not create duplicate records or other side effects.

## Give one example of a NON-idempotent scheduled job and how you would make it idempotent.

Sending a payment reminder could be non-idempotent because running it twice could send the same reminder twice. I would store a record showing that the reminder was already sent and check that record before sending another one. A processed-ids table could be used for this.