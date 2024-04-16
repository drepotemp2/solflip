const notifyChannel = async (bot, player, gameId, amount) => {
  replyText = `*GAME COMPLETED*🔴😎

Game ID: *${gameId}*

Winner: *${player}*

Amount Earned: *${amount} SOL*  
`;

  bot.telegram.sendMessage(process.env.CHANNEL_ID, replyText, {
    parse_mode: "Markdown",
  });
};

module.exports = awardGameWinner = async (result, gameDetails, bot, newGame) => {
  const resultValue = result == 1 ? "HEAD" : "TAIL";
  const { player1, player2 } = gameDetails;

  //If Player 1 wins
  if (
    gameDetails.player1Flip == resultValue &&
    gameDetails.player2Flip !== resultValue
  ) {
    gameDetails = Object.assign(gameDetails, { status: "COMPLETED" });
    await gameDetails.save();

    const totalAmount = gameDetails.amount * 2;
    const charges = totalAmount * 0.02
    const creditAmount = totalAmount - charges;

    player1ReplyText = `
Congratulations✨ You won the game.
You picked: *${gameDetails.player1Flip}*
Player 2 picked: *${gameDetails.player2Flip}*

Toss Results: *${resultValue}*

Amount earned: *${creditAmount} SOL*   
`;

    player2ReplyText = `
Sorry😔 You lost the game.
You picked: *${gameDetails.player2Flip}*
Player 1 picked: *${gameDetails.player1Flip}*

Toss Results: *${resultValue}*

Start a new game and try again.   
`;

    //Notify player 1 of win
    bot.telegram.sendMessage(player1, player1ReplyText, {
      parse_mode: "Markdown",
    });

    //Notify player 2 of loss
    bot.telegram.sendMessage(player2, player2ReplyText, {
      parse_mode: "Markdown",
    });

    //Notify channel of game status
    await notifyChannel(bot, "Player 1", gameDetails.gameId, creditAmount);

    //End the new game state
    newGame = false
  } else {
    //if player 2 wins
    gameDetails = Object.assign(gameDetails, { status: "COMPLETED" });
    await gameDetails.save();

    const totalAmount = gameDetails.amount * 2;
    const charges = gameDetails.amount * 2 * 0.2;

    const creditAmount = totalAmount - charges;

    player2ReplyText = `
Congratulations✨ You won the game.
You picked: *${gameDetails.player2Flip}*
Player 1 picked: *${gameDetails.player1Flip}*

Toss Results: *${resultValue}*

Amount earned: *${creditAmount} SOL*   
`;

    player1ReplyText = `
Sorry😔 You lost the game.
You picked: *${gameDetails.player1Flip}*
Player 2 picked: *${gameDetails.player2Flip}*

Toss Results: *${resultValue}*

Start a new game and try again.   
`;

    //Notify player 1 of loss
    bot.telegram.sendMessage(player1, player1ReplyText, {
      parse_mode: "Markdown",
    });

    //Notify player 2 of win
    bot.telegram.sendMessage(player2, player2ReplyText, {
      parse_mode: "Markdown",
    });

    //Notify channel of game status
    await notifyChannel(bot, "Player 2", gameDetails.gameId, creditAmount);

    //end the new game state
    newGame = false
  }
};
