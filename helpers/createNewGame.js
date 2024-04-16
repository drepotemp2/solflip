const Game = require("../models/gameModel");
const { v4: uuidv4 } = require('uuid');

module.exports = createNewGame = async (ctx, amount, bot) => {
  const { id } = ctx.from;
  const gameId = uuidv4();
  const newGame = new Game({
    gameId,
    player1: id,
    amount,
    status: "OPEN",
  });

  try {
    await newGame.save();
  } catch (error) {
    return ctx.reply("Game could not be created. Please try again.");
  }

  const replyText = `
*Game created!*😎 

Staked amount: *${amount} SOL*

Awaiting player 2 for the game to begin.

I'll notify you when player 2 joins.
`;

  // Reply player 1
  ctx.reply(replyText, {
    parse_mode: "Markdown",
  });

  const channelNotification = `
*OPEN GAME ALERT!*😎✨

Game ID: *${gameId}*

Staked amount: *${amount} SOL*

Status: OPEN 🟡

Awaiting player 2.

Join below if interested👇

[Click me to Join as player 2](t.me/solflipbot?start=gameId=${gameId})
`;

  bot.telegram.sendMessage(process.env.CHANNEL_ID, channelNotification, {
    parse_mode: "Markdown",
    disable_web_page_preview:true
  });
};
