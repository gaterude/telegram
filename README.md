# Chama Telegram Bot

A Telegram bot made for a real chama group to help with contributions, member management and group communication.

## Problem

The group needed an easier way for members to record contributions, check their balances and receive reminders. Admins also needed simple tools for managing members and sending announcements.

## Features

- Contribution through inline buttons
- Check personal balance
- View group statistics
- Welcome and rules for new members
- Admin `/kick` and `/mute` commands
- Admin `/broadcast` command
- `/start` and `/stop` for broadcast subscriptions
- Scheduled reminders
- PostgreSQL for storing data
- Redis for sessions and rate limiting

## Tech Used

- Node.js
- Telegram Bot API
- PostgreSQL
- Redis
- node-cron
- Express
- Jest

## Main Commands

/start
/help
/stop
/kick
/mute
/broadcast <message>

Admin commands are restricted to group administrators.

Running the Project

Install dependencies:

npm install

Start the server:

node index.js

Run tests:

npm test

The bot is connected to a real Telegram chama group for testing.

Screenshots

Screenshots showing the bot features and testing are available in the SCREENSHOT folder.
- Basic Telegram bot documentation
