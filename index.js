import connectDb from "./src/config/db.js";
import bot from "./server.js";

// Connect to the database
connectDb();

// Start the Telegram bot
bot.launch();
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
