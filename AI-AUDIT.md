
## Week 20 - Day 1
BotFather Creation

 Completed manually using Telegram and @BotFather.
 Created the Telegram bot and received the bot token.
 The bot token was stored securely in the environment configuration.
 The bot token was not committed to Git.

Environment Variable Setup

 Added `TELEGRAM_BOT_TOKEN` to the `.env` file manually.
 Verified that the application can access the environment variable.
 The `.env` file is excluded from Git.

Webhook Route
 Created the Telegram webhook route manually.
 The route receives Telegram updates through the Express server.
 The `/start` command sends the initial bot response.

Webhook Registration

 Registered the Telegram webhook manually using the Telegram Bot API.
 Used the ngrok HTTPS URL as the webhook endpoint.
 Verified the webhook using `getWebhookInfo`.

 First Reply
 Tested the bot from a Telegram phone client.
 Sent `/start`.
 Confirmed that the bot received the update and returned the expected response.

 AI Usage
 AI assistance was used only for repeated implementation patterns and debugging after the initial manual handshake.

## Week 20 - Day 2
## Week 20 - Day 2

Callback Query Handling

Worked on understanding the difference between a `message` update and a `callback_query` update in Telegram. A `message` update is triggered when a user sends a normal message  while a `callback_query` update is triggered when a user presses an inline keyboard button. Callback queries must be answered using `answerCallbackQuery` so Telegram knows that the button interaction has been received and processed. If the callback query is not answered, Telegram may continue showing a loading indicator on the user's button and the interaction may appear stuck.

Debug Notes

Tested the callback handling flow and checked the server logs when processing button interactions. Verified that callback data can be read from `query.data` and used to determine the next action in the bot conversation.

AI Usage
 used for understanding repeated Telegram callback-handling patterns and debugging after the initial implementation.
