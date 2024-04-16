const Game = require("../models/gameModel");

module.exports = joinGame = async (gameDetails, ctx, bot) => {
  const { amount, gameId, player1Flip } = gameDetails;
  const player2 = ctx.from.id;
  const player1HasPlayed = player1Flip ? true : false;

  // Add player 2 to the game
  try {
    const playerAdded = await Game.findOneAndUpdate({ gameId }, { player2 });
    // console.log(playerAdded);
    // console.log(gameDetails);
    if (!playerAdded) {
      return ctx.reply("Couldn't join the game. Please try again later.");
    }

    const player1ReplyText = `Player 2 has joined, they're waiting for you to play😎

*Pick a HEAD or TAIL*.`;

    const replyMarkup = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "HEAD", callback_data: "pick-head" }],
          [{ text: "TAIL", callback_data: "pick-tail" }],
        ],
      },
    };

    //Inform player 1 that player 2 has joined
    await bot.telegram.sendMessage(gameDetails.player1, player1ReplyText, {
      ...replyMarkup,
      parse_mode: "Markdown",
    });

    const channelNotification = `
*GAME STARTED*😎

Game ID: *${gameId}*

Staked amount: *${amount} SOL*

Status: ONGOING 🟢
 `;

    //Update game status
    await Game.findOneAndUpdate({ gameId }, { status: "ONGOING" });

    //Notify channel of game status
    bot.telegram.sendMessage(process.env.CHANNEL_ID, channelNotification, {
      parse_mode: "Markdown",
    });
  } catch (error) {
    return ctx.reply("Couldn't join the game. Please try again later.");
  }

  let player2ReplyText = `
Welcome to the game😎

Game-id: *${gameId}*

Staked amount: *${amount} SOL*
`;

  if (player1HasPlayed) {
    player2ReplyText += `
Pick a HEAD or TAIL.`;
  }

  if (!player1HasPlayed) {
    player2ReplyText += `\nWaiting for player 1 to pick a HEAD or TAIL.

After they pick, you will pick, then i will toss the coin.
  `;
  }

  const replyMarkup = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "HEAD", callback_data: "pick-head" }],
        [{ text: "TAIL", callback_data: "pick-tail" }],
      ],
    },
  };

  // Ask player 2 to play if player 1 has played
  if (player1HasPlayed) {
    return ctx.reply(player2ReplyText, {
      ...replyMarkup,
      parse_mode: "Markdown",
    });
  }

  // Ask player 2 to wait for player 1
  ctx.reply(player2ReplyText, {
    parse_mode:"Markdown"
  });
};
