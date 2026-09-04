// ==========================================
// DAY 3
// GROUP MEMBER HANDLER
// ==========================================

async function handleChatMemberUpdate(
  bot,
  event,
  db
) {
  const chatId = event.chat.id;

  const oldStatus =
    event.old_chat_member.status;

  const newStatus =
    event.new_chat_member.status;

  const user =
    event.new_chat_member.user;


  // ==========================================
  // USER JOINED
  // ==========================================

  if (
    (oldStatus === "left" ||
      oldStatus === "kicked") &&
    (
      newStatus === "member" ||
      newStatus === "restricted"
    )
  ) {
    try {
      // Save member
      if (db) {
        await db.query(
          `INSERT INTO group_members
           (
             chat_id,
             user_id,
             first_name,
             joined_at,
             left_at,
             role
           )
           VALUES
           (
             $1,
             $2,
             $3,
             NOW(),
             NULL,
             'member'
           )
           ON CONFLICT
           (
             chat_id,
             user_id
           )
           DO UPDATE SET
             first_name = EXCLUDED.first_name,
             joined_at = NOW(),
             left_at = NULL,
             role = 'member'`,
          [
            chatId,
            user.id,
            user.first_name || null,
          ]
        );
      }


      // ==========================================
      // RESTRICT NEW MEMBER
      // ==========================================
await bot.restrictChatMember(
  chatId,
  user.id,
  {
    permissions: {
      can_send_messages: false,
      can_send_audios: false,
      can_send_documents: false,
      can_send_photos: false,
      can_send_videos: false,
      can_send_video_notes: false,
      can_send_voice_notes: false,
      can_send_polls: false,
      can_send_other_messages: false,
      can_add_web_page_previews: false,
    },
    use_independent_chat_permissions: true,
  }
);


      // ==========================================
      // SEND RULES
      // ==========================================

      await bot.sendMessage(
        chatId,
        `Karibu ${user.first_name || "there"}! Please read and accept the rules:\n\n` +
          `1. Be kind.\n` +
          `2. No spam.\n` +
          `3. English or Kiswahili only.`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text:
                    "Accept rules",
                  callback_data:
                    `acc:${user.id}`,
                },
              ],
            ],
          },
        }
      );

      console.log(
        `New member saved: ${user.first_name} (${user.id}) in ${chatId}`
      );
    } catch (err) {
      console.error(
        "New member handler error:",
        err.message
      );
    }
  }


  // ==========================================
  // USER LEFT
  // ==========================================

  if (
    (
      oldStatus === "member" ||
      oldStatus === "administrator" ||
      oldStatus === "restricted"
    ) &&
    (
      newStatus === "left" ||
      newStatus === "kicked"
    )
  ) {
    try {
      if (db) {
        await db.query(
          `UPDATE group_members
           SET left_at = NOW()
           WHERE chat_id = $1
           AND user_id = $2`,
          [
            chatId,
            user.id,
          ]
        );
      }

      console.log(
        `Member left: ${user.first_name} (${user.id}) from ${chatId}`
      );
    } catch (err) {
      console.error(
        "Member leave handler error:",
        err.message
      );
    }
  }
}


// ==========================================
// BOT MEMBERSHIP CHANGED
// ==========================================

async function handleBotMembershipUpdate(
  bot,
  event
) {
  console.log(
    `Bot membership changed in chat ${event.chat.id}: ` +
      `${event.old_chat_member.status} -> ` +
      `${event.new_chat_member.status}`
  );
}


module.exports = {
  handleChatMemberUpdate,
  handleBotMembershipUpdate,
};