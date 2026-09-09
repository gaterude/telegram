const { 
  getSession, 
  setSession, 
} = require("../services/session.service"); 


async function promptContribution( 
  bot, 
  chatId, 
  userId 
) { 
  await setSession( 
    chatId, 
    userId, 
    { 
      state: 
        "awaiting_amount", 
      context: {}, 
    } 
  ); 

  await bot.sendMessage( 
    chatId, 
    "How much are you contributing?", 
    { 
      reply_markup: { 
        inline_keyboard: [ 
          [ 
            { 
              text: "KSh 500", 
              callback_data: 
                "amt:500", 
            }, 
            { 
              text: "KSh 1000", 
              callback_data: 
                "amt:1000", 
            }, 
            { 
              text: "KSh 2000", 
              callback_data: 
                "amt:2000", 
            }, 
          ], 
          [ 
            { 
              text: "Custom amount", 
              callback_data: 
                "amt:custom", 
            }, 
          ], 
        ], 
      }, 
    } 
  ); 
} 


async function confirmContribution( 
  bot, 
  chatId, 
  userId, 
  amount 
) { 
  await setSession( 
    chatId, 
    userId, 
    { 
      state: "confirming", 
      context: { 
        amount, 
      }, 
    } 
  ); 

  await bot.sendMessage( 
    chatId, 
    `Confirm contribution of KSh ${amount}?`, 
    { 
      reply_markup: { 
        inline_keyboard: [ 
          [ 
            { 
              text: 
                "Yes, contribute", 
              callback_data: 
                "cnf:yes", 
            }, 
            { 
              text: "Cancel", 
              callback_data: 
                "cnf:no", 
            }, 
          ], 
        ], 
      }, 
    } 
  ); 
} 


async function showBalance( 
  bot, 
  chatId, 
  userId, 
  db 
) { 
  try { 
    const result = await db.query( 
      `SELECT COALESCE(SUM(amount), 0) AS total 
       FROM contributions 
       WHERE chat_id = $1 
       AND user_id = $2 
       AND status = 'completed'`, 
      [ 
        chatId, 
        userId, 
      ] 
    ); 

    const total = result.rows[0].total; 

    await bot.sendMessage( 
      chatId, 
      `Your total contributions: KSh ${total}` 
    ); 
  } catch (err) { 
    console.error( 
      "Error fetching balance:", 
      err.message 
    ); 

    await bot.sendMessage( 
      chatId, 
      "Error fetching your balance. Please try again." 
    ); 
  } 
} 


async function showStats( 
  bot, 
  chatId, 
  db 
) { 
  try { 
    const result = await db.query( 
      `SELECT 
         COALESCE(SUM(amount), 0) AS total, 
         COUNT(*) AS contributions, 
         COUNT(DISTINCT user_id) AS contributors 
       FROM contributions 
       WHERE chat_id = $1 
       AND status = 'completed'`, 
      [ 
        chatId, 
      ] 
    ); 

    const stats = result.rows[0]; 

    await bot.sendMessage( 
      chatId, 
      `Group contribution stats:\n\n` + 
      `Total contributed: KSh ${stats.total}\n` + 
      `Number of contributions: ${stats.contributions}\n` + 
      `Contributors: ${stats.contributors}` 
    ); 
  } catch (err) { 
    console.error( 
      "Error fetching group stats:", 
      err.message 
    ); 

    await bot.sendMessage( 
      chatId, 
      "Error fetching group stats. Please try again." 
    ); 
  } 
} 


async function handleCallbackQuery( 
  bot, 
  ctx, 
  db 
) { 
  const query = 
    ctx.callbackQuery || ctx; 

  const chatId = 
    query.message.chat.id; 

  const data = 
    query.data; 

  const userId = 
    query.from.id; 

  console.log( 
    "handleCallbackQuery - data:", 
    data, 
    "chatId:", 
    chatId, 
    "userId:", 
    userId 
  ); 


  // ========================================== 
  // DAY 3 ADDITION 
  // ACCEPT RULES 
  // ========================================== 

  if ( 
    data.startsWith("acc:") 
  ) { 
    const allowedUserId = 
      parseInt( 
        data.slice(4), 
        10 
      ); 

    // Make sure the correct user 
    // clicked their own button 
    if ( 
      userId !== 
      allowedUserId 
    ) { 
      await bot.answerCallbackQuery( 
        query.id, 
        { 
          text: 
            "This button is not for you.", 
          show_alert: true, 
        } 
      ); 

      return; 
    } 

    try { 
      // Restore permissions 
      await bot.restrictChatMember( 
        chatId, 
        allowedUserId, 
        { 
          permissions: { 
            can_send_messages: true, 
            can_send_audios: true, 
            can_send_documents: true, 
            can_send_photos: true, 
            can_send_videos: true, 
            can_send_video_notes: true, 
            can_send_voice_notes: true, 
            can_send_polls: true, 
            can_send_other_messages: true, 
            can_add_web_page_previews: true, 
          }, 
          use_independent_chat_permissions: true, 
        } 
      ); 

      const updatedMember = 
        await bot.getChatMember( 
          chatId, 
          allowedUserId 
        ); 

      console.log( 
        "Permissions aftr accepting rules", 
        updatedMember.status, 
        updatedMember.can_send_messages 
      ); 

      await bot.answerCallbackQuery( 
        query.id, 
        { 
          text: 
            "Rules accepted!", 
        } 
      ); 


      await bot.editMessageText( 
        `Thanks ${query.from.first_name || "there"}! You can now participate.`, 
        { 
          chat_id: chatId, 
          message_id: 
            query.message.message_id, 
        } 
      ); 


      console.log( 
        `Rules accepted by ${allowedUserId} in group ${chatId}` 
      ); 
    } catch (err) { 
      console.error( 
        "Rules acceptance error:", 
        err.message 
      ); 

      await bot.answerCallbackQuery( 
        query.id, 
        { 
          text: 
            "Could not update your permissions.", 
          show_alert: true, 
        } 
      ); 
    } 

    return; 
  } 


  // ========================================== 
  // EXISTING CONTRIBUTION LOGIC 
  // ========================================== 

  if ( 
    data === "contribute" 
  ) { 
    console.log( 
      "Routing to promptContribution" 
    ); 

    await bot.answerCallbackQuery( 
      query.id 
    ); 

    await promptContribution( 
      bot, 
      chatId, 
      userId 
    ); 


  } else if ( 
    data === "balance" 
  ) { 
    console.log( 
      "Routing to showBalance" 
    ); 

    await bot.answerCallbackQuery( 
      query.id 
    ); 

    await showBalance( 
      bot, 
      chatId, 
      userId, 
      db 
    ); 


  } else if ( 
    data === "stats" 
  ) { 
    console.log( 
      "Routing to showStats" 
    ); 

    await bot.answerCallbackQuery( 
      query.id 
    ); 

    await showStats( 
      bot, 
      chatId, 
      db 
    ); 


  } else if ( 
    data === "amt:custom" 
  ) { 
    console.log( 
      "Routing to custom amount prompt" 
    ); 

    await bot.answerCallbackQuery( 
      query.id 
    ); 

    await setSession( 
      chatId, 
      userId, 
      { 
        state: 
          "awaiting_custom_amount", 
        context: {}, 
      } 
    ); 

    await bot.sendMessage( 
      chatId, 
      "Type the amount in KSh:" 
    ); 


  } else if ( 
    data.startsWith("amt:") 
  ) { 
    const amount = 
      parseInt( 
        data.slice(4), 
        10 
      ); 

    console.log( 
      "Routing to confirmContribution, amount:", 
      amount 
    ); 

    await bot.answerCallbackQuery( 
      query.id 
    ); 

    await confirmContribution( 
      bot, 
      chatId, 
      userId, 
      amount 
    ); 


  } else if ( 
    data === "cnf:yes" 
  ) { 
    console.log( 
      "Confirming contribution" 
    ); 

    await bot.answerCallbackQuery( 
      query.id 
    ); 

    const session = 
      await getSession( 
        chatId, 
        userId 
      ); 

    const amount = 
      session.context.amount; 

    try { 
      // Write contribution to database 
      if (db) { 
        await db.query( 
          `INSERT INTO contributions 
           (chat_id, user_id, amount, status) 
           VALUES 
           ($1, $2, $3, 'completed')`, 
          [ 
            chatId, 
            userId, 
            amount, 
          ] 
        ); 

        console.log( 
          "Saved to DB - chatId:", 
          chatId, 
          "userId:", 
          userId, 
          "amount:", 
          amount 
        ); 
      } 

      await bot.sendMessage( 
        chatId, 
        `Contribution of KSh ${amount} recorded!` 
      ); 

      await setSession( 
        chatId, 
        userId, 
        { 
          state: "idle", 
          context: {}, 
        } 
      ); 
    } catch (err) { 
      console.error( 
        "Error saving contribution:", 
        err.message 
      ); 

      await bot.sendMessage( 
        chatId, 
        "Error saving contribution. Please try again." 
      ); 
    } 


  } else if ( 
    data === "cnf:no" 
  ) { 
    console.log( 
      "Cancelling contribution" 
    ); 

    await bot.answerCallbackQuery( 
      query.id 
    ); 

    await bot.sendMessage( 
      chatId, 
      "Contribution cancelled." 
    ); 

    await setSession( 
      chatId, 
      userId, 
      { 
        state: "idle", 
        context: {}, 
      } 
    ); 


  } else { 
    await bot.answerCallbackQuery( 
      query.id 
    ); 

    console.log( 
      "Unknown callback data:", 
      data 
    ); 
  } 
} 


module.exports = { 
  handleCallbackQuery, 
  promptContribution, 
  confirmContribution, 
  showBalance, 
  showStats, 
};