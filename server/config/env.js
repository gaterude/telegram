require("dotenv").config();

module.exports = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  PORT: process.env.PORT || 3000, 
   PUBLIC_URL: process.env.PUBLIC_URL,
   ADMIN_CHAT_ID: process.env.ADMIN_CHAT_ID,

};