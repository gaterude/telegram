// const express = require("express");

// const router = express.Router();

// const telegram = require("../services/telegram.service");

// router.post(
//   "/webhook",
//   express.json(),
//   async (req, res) => {
//     console.log(
//       "Telegram webhook received:"
//     );

//     console.log(
//       JSON.stringify(
//         req.body,
//         null,
//         2
//       )
//     );

//     res.json({
//       ok: true,
//     });

//     await telegram.processUpdate(
//       req.body
//     );
//   }
// );

// module.exports = router;
const express = require("express");

const router = express.Router();

const telegram = require("../services/telegram.service");
const { broadcast } = require("../services/broadcast.service");

router.post(
  "/webhook",
  express.json(),
  async (req, res) => {
    console.log(
      "Telegram webhook received:"
    );

    console.log(
      JSON.stringify(
        req.body,
        null,
        2
      )
    );

    res.json({
      ok: true,
    });

    await telegram.processUpdate(
      req.body
    );
  }
);

// ==========================================
// WEEK 20 BROADCAST
// ==========================================

router.post(
  "/broadcast",
  async (req, res) => {
    try {
      const text =
        req.body?.text?.toString().trim();

      if (!text || text.length < 3) {
        return res.status(400).json({
          ok: false,
          error: "Message too short",
        });
      }

      const result = await broadcast(
        text
      );

      res.json({
        ok: true,
        ...result,
      });
    } catch (err) {
      console.error(
        "Broadcast route error:",
        err.message
      );

      res.status(500).json({
        ok: false,
        error: "Broadcast failed",
      });
    }
  }
);

module.exports = router;