import { Telegraf } from "telegraf";
// import userModel from "./src/models/User.js";
// import eventModel from "./src/models/Event.js";
// import openai from "./src/config/openai.js";
import { start } from "./src/bots/start.js";
import { generate } from "./src/bots/generate.js";
import { handleMessage } from "./src/bots/message.js";
import { message } from "telegraf/filters";

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start(start);
bot.command("generate", generate);
bot.on(message("text"), handleMessage);
export default bot;
