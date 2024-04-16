const Game = require("../models/gameModel");
const awardGameWinner = require("./awardGameWinner");
const tossCoin = require("./tossCoin");

module.exports = handlePick = async (pick, ctx, bot, newGame)=>{
    try {
        const playerId = ctx.from.id;
        // Search for a game where the provided ID matches either player1 or player2
        let gameDetails = await Game.findOne({
          $or: [{ player1: playerId }, { player2: playerId }],
        });

    
        if (!gameDetails) {
            console.log(gameDetails)
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
          console.log("Update player pick:", gameDetails)
    
          let player2Id = gameDetails.player2;

          //Tell player 1 to wait for player 2 to pick
          await bot.telegram.sendMessage(gameDetails.player1, "You picked *HEAD*.\nNow wait for player 2 to pick a face. After they pick, i'll toss the coin.", {parse_mode:"Markdown"})
    
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
    
          //Inform player 1 that player 2 has picked
          await bot.telegram.sendMessage(gameDetails.player1, "Player 2 has picked.")
    
          //Inform both players of toss commencement
          await bot.telegram.sendMessage(gameDetails.player1, "Tossing coin, please wait...🔴🔴🔴")
          await bot.telegram.sendMessage(gameDetails.player2, "Tossing coin, please wait...🔴🔴🔴")
    
          const tossResult = tossCoin()
    
          await awardGameWinner(tossResult, gameDetails, bot)
    
        }
      } catch (error) {
        ctx.reply("An error occured. Please try again.")
        console.log(error)
      }
}