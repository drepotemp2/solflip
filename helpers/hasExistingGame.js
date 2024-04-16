const Game = require("../models/gameModel");

module.exports = async (ctx) => {
  const { id } = ctx.from;

  try {
    const gamesAsPlayer1 = await Game.find({ player1: id });
    const gamesAsPlayer2 = await Game.find({ player2: id });

    const allGames = [...gamesAsPlayer1, ...gamesAsPlayer2];

    if (allGames.length > 0) {
      const allCompleted = allGames.every(game => game.status === "COMPLETED");
      return !allCompleted;
    } else {
      return false;
    }
  } catch (error) {
    ctx.reply("An error occurred. Please try again later.");
  }
};
