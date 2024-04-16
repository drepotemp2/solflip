const { Schema, model } = require("mongoose");

const gameSchema = new Schema(
  {
    gameId: String,
    player1:Number,
    player2:Number,
    amount: Number,
    status: String,
    player1Flip:String,
    player2Flip:String,
    result:String,
  },
  {
    timestamps: true,
  }
);

const Game = model("game", gameSchema);
module.exports = Game
