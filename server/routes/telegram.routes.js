// // server/routes/telegram.routes.js
// const express = require("express");
// const router = express.Router();
// const telegram = require("../services/telegram.service");

// router.post("/webhook", express.json(), async (req, res) => {
//   res.json({ ok: true });
//   await telegram.processUpdate(req.body);
// });

// module.exports = router;
const express = require("express");
const router = express.Router();
const telegram = require("../services/telegram.service");

router.post("/webhook", express.json(), async (req, res) => {
  console.log(" Telegram webhook received:");
  console.log(JSON.stringify(req.body, null, 2));

  res.json({ ok: true });

  await telegram.processUpdate(req.body);
});

module.exports = router;