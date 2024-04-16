const { Telegraf } = require("telegraf");
require("dotenv/config");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const createNewGame = require("./helpers/createNewGame");
const Game = require("./models/gameModel");
const startNewGamePrompt = require("./helpers/startNewGamePrompt");
const hasExistingGame = require("./helpers/hasExistingGame");
const tossCoin = require("./helpers/tossCoin");
const awardGameWinner = require("./helpers/awardGameWinner");
const handlePick = require("./helpers/handlePick");
const joinGame = require("./helpers/joinGame");
let newGame = false;

const app = require("express")();

app.get("/", (req, res) => res.send("Hello solflipbot"));

const bot = new Telegraf(process.env.BOT_TOKEN);

const port = process.env.PORT || 3895;
app.listen(port, () => console.log("App is running"));

const URI = process.env.URI;
mongoose
  .connect(URI)
  .then(() => console.log("Connected to db"))
  .catch((err) => console.log("Error connecting to database\n" + err));

const showMenu = async (ctx) => {
  const replyText = `
Welcome to solflip bot.
Select an option below to continue.
    `;

  const replyMarkup = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "New game ✅", callback_data: "new-game" }],
        [{ text: "See open games 😎", callback_data: "open-games" }],
      ],
    },
  };

  await ctx.reply(replyText, {
    ...replyMarkup,
    reply_to_message_id: ctx.message.message_id,
  });
};

//handles /start command
bot.start(async (ctx) => {
  const gameId = ctx.message.text.split("=")[1];

  if (!gameId) {
    //Show normal menu if user didn't come via a game link
    return await showMenu(ctx);
  }

  try {
    const gameDetails = await Game.findOne({ gameId });

    // Reply if game doesn't exist
    if (!gameDetails) {
      await startNewGamePrompt("Game doesn't exist.", ctx);
    }

    //Reply if players are already completed
    if (gameDetails.player1 && gameDetails.player2) {
      await startNewGamePrompt("Game slots are filled.", ctx);
    }

    // Check if player has existing games
    if (await hasExistingGame(ctx)) {
      return await ctx.reply(
        "Please complete your existing game before starting a new one."
      );
    }

    //Join game
    await joinGame(gameDetails, ctx, bot);
  } catch (error) {
    console.log(error);
    ctx.reply("An error occured, please try again later.");
  }
});

// handles /new_game
const startNewGame = async (ctx) => {
  if (await hasExistingGame(ctx)) {
    return await ctx.reply(
      "Please complete your existing games before starting a new one."
    );
  }

  newGame = true;
  const replyText = `
To start a new game, please enter deposit amount, in SOL`;
  await ctx.reply(replyText);
};

// new-game callback handler
bot.action("new-game", async (ctx) => {
  await startNewGame(ctx);
});

// /new_game command handler
bot.command("new_game", async (ctx) => {
  await startNewGame(ctx);
});

bot.action("pick-head", async (ctx) => {
  handlePick("HEAD", ctx, bot, newGame);
});

bot.action("pick-tail", (ctx) => {
  handlePick("TAIL", ctx, bot, newGame);
});

bot.action("open-games", async (ctx) => {
  await showOpenGames(ctx);
});

bot.command("open_games", async (ctx) => {
  await showOpenGames(ctx);
});

//handles user input. WARNING: All command handlers MUST be written above this function.
bot.on("message", async (ctx) => {
  let userInput = ctx.message.text.trim();
  //Ignore empty inputs
  if (!userInput) return;

  //Ignore inputs outside user flow
  if (!newGame) {
    return await ctx.reply(
      "Invalid command or entry. Please use the menu to start a game or see open games."
    );
  }

  if (await hasExistingGame(ctx)) {
    return await ctx.reply(
      "Please complete your existing games before starting a new one."
    );
  }

  let sol_amount = parseFloat(userInput);
  //handles invalid sol amount input
  if (isNaN(sol_amount)) {
    return await ctx.reply("Invalid SOL amount. Please enter a valid amount.");
  }

  if (sol_amount == 0) {
    return await ctx.reply("Stake must be greater than 0.");
  }

  //   Create game
  await createNewGame(ctx, sol_amount, bot);
});

const showOpenGames = async (ctx) => {
  // ctx.reply("No open games yet. Check again later.");
  try {
    const allOpenGames = await Game.find({ status: "OPEN" });

    //If there are no open games
    if (allOpenGames.length == 0) {
      return ctx.reply(
        "No open games yet, check again later or start a new one to play."
      );
    }

    const creditAmount = (price) => {
      const totalAmount = price * 2;
      const charges = totalAmount * 0.02;
      return totalAmount - charges;
    };

    //List open game(s)
    let replyText = `
🟡🟡 *ALL OPEN GAMES* 🟡🟡  
`;

    allOpenGames.forEach((eachGame) => {
      replyText += `
*=============================*

GAME ID: *${eachGame.gameId}*

STAKED AMOUNT: *${eachGame.amount} SOL*

CASHOUT AMOUNT: *${creditAmount(eachGame.amount)} SOL*

[Join game here](t.me/solflipbot?start=gameId=${eachGame.gameId})

*=============================*
`;
      ctx.reply(replyText, { parse_mode: "Markdown", disable_web_page_preview:true });
    });
  } catch (error) {
    ctx.reply("Couldn't load open games. Please try again later.")
    console.log(error)
  }
};

// Set bot commands for Telegram
bot.telegram.setMyCommands([
  { command: "start", description: "Start the Solflipbot" },
  { command: "new_game", description: "Start a new game" },
  {
    command: "open_games",
    description: "See list of games awaiting player 2",
  },
]);

bot.launch();

module.exports = bot;
