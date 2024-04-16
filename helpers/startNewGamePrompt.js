module.exports = startNewGamePrompt = async (topMessage, ctx)=>{
    const replyText = `
    ${topMessage}
Click the button below to start a new game.
    `;

  const replyMarkup = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "New game ✅", callback_data: "new-game" }],
      ],
    },
  };

  await ctx.reply(replyText, {
    ...replyMarkup,
  });
}