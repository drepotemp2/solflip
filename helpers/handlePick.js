const Game = require("../models/gameModel");
const awardGameWinner = require("./awardGameWinner");
const tossCoin = require("./tossCoin");

module.exports = handlePick = async (pick, ctx, bot, newGame) => {
  try {
    const playerId = ctx.from.id;
     // Search for a game where the provided ID matches either player1 or player2,
    // and the status is not "COMPLETED"
    let gameDetails = await Game.findOne({
      $and: [
        { $or: [{ player1: playerId }, { player2: playerId }] },
        { status: { $ne: "COMPLETED" } }
      ]
    });
    
    console.log("game details" + gameDetails);
    if (!gameDetails) {
      console.log("No game details" + gameDetails);
      return;
    }

    //Check if game is already completed
    if (gameDetails.status == "COMPLETED") {
      return;
    }

    // check if user is player 1 or player 2
    const isPlayer1 = gameDetails.player1 == playerId ? true : false;

    if (isPlayer1) {
      //Update player's pick
      gameDetails = Object.assign(gameDetails, { player1Flip: pick });
      await gameDetails.save();

      //Tell player 1 to wait for player 2 to pick
      await bot.telegram.sendMessage(
        gameDetails.player1,
        `You picked *${pick}*.\nNow wait for player 2 to pick a face. After they pick, i'll toss the coin.`,
        { parse_mode: "Markdown" }
      );

      let player2Id = gameDetails.player2;
      //Notify player 2 to pick
      if (player2Id) {
        const player2ReplyText =
          "Player 1 has picked a face.\nYour turn.\n\n*Pick HEAD or TAIL*";

        const replyMarkup = {
          reply_markup: {
            inline_keyboard: [
              [{ text: "HEAD", callback_data: "pick-head" }],
              [{ text: "TAIL", callback_data: "pick-tail" }],
            ],
          },
        };

        await bot.telegram.sendMessage(player2Id, player2ReplyText, {
          ...replyMarkup,
          parse_mode: "Markdown",
        });
      }
    } else {
      // check if player 1 has picked a face
      if (!gameDetails.player1Flip) {
        return ctx.reply("Please wait for player 1 to pick a face.");
      }

      //Update player's pick
      gameDetails = Object.assign(gameDetails, { player2Flip: pick });
      await gameDetails.save();

      //Inform player 2 of what they picked
      await bot.telegram.sendMessage(
        gameDetails.player2,
        `You picked: *${pick}*`,
        {
          parse_mode: "Markdown",
        }
      );

      //Inform player 1 that player 2 has picked
      await bot.telegram.sendMessage(
        gameDetails.player1,
        "Player 2 has picked."
      );

      //Inform both players of toss commencement
      await bot.telegram.sendMessage(
        gameDetails.player1,
        "Tossing coin now, please wait...🔴🔴🔴"
      );
      await bot.telegram.sendMessage(
        gameDetails.player2,
        "Tossing coin now, please wait...🔴🔴🔴"
      );

      const tossResult = tossCoin();

      //Check for a DRAW
      const resultValue = tossResult == 1 ? "HEAD" : "TAIL";
      if (gameDetails.player1Flip == gameDetails.player2Flip) {
        //Update game status
        gameDetails = Object.assign(gameDetails, { status: "COMPLETED" });

        let replyText = `*Oops, the game is a DRAW*\n`;

        let player2Chunk = `\nYou picked: *${gameDetails.player1Flip}*\nPlayer 2 picked: *${gameDetails.player2Flip}*`;

        let player1Chunk = `\nYou picked: *${gameDetails.player2Flip}*\n\nPlayer 1 picked: *${gameDetails.player1Flip}*`;

        const finalChunk = `\n\nToss Results: *${resultValue}*\n\nStart another game and try again.`;

        // const replyMarkup = {
        //   reply_markup: {
        //     inline_keyboard: [
        //       [{ text: "HEAD", callback_data: "pick-head" }],
        //       [{ text: "TAIL", callback_data: "pick-tail" }],
        //     ],
        //   },
        // };

        //Notify bot players of a draw
        await bot.telegram.sendMessage(
          gameDetails.player1,
          replyText + player1Chunk + finalChunk,
          {
            parse_mode: "Markdown",
          }
        );

        await bot.telegram.sendMessage(
          gameDetails.player2,
          replyText + player2Chunk + finalChunk,
          {
            parse_mode: "Markdown",
          }
        );

        //Notify channel of a draw
        const channelNotification = `*GAME COMPLETED 🔴😎*\n\nGame ID: *${gameDetails.gameId}*\n\nStatus: *DRAW*`;
        return ctx.telegram.sendMessage(
          process.env.CHANNEL_ID,
          channelNotification,
          {
            parse_mode: "Markdown",
          }
        );
      }

      await awardGameWinner(tossResult, gameDetails, bot, newGame);
    }
  } catch (error) {
    ctx.reply("An error occured. Please try again.");
    console.log(error);
  }
};
