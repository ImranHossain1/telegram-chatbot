import { Telegraf } from "telegraf";
import userModel from "./src/models/User.js";
import eventModel from "./src/models/Event.js";
import connectDb from "./src/config/db.js";
import { message } from "telegraf/filters";
import OpenAI from "openai";

const bot = new Telegraf(process.env.BOT_TOKEN);
const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"], // This is the default and can be omitted
});

try {
  connectDb();
  console.log("database connected successfully");
} catch (err) {
  console.log(err);
  process.kill(process.pid, "SIGTERM");
}

bot.start(async (ctx) => {
  // console.log("ctx", ctx)
  // store the user info into db
  const from = ctx.update.message.from;
  try {
    await userModel.findOneAndUpdate(
      { tgId: from.id },
      {
        $setOnInsert: {
          firstname: from.first_name,
          lastName: from.last_name,
          isBot: from.is_bot,
          username: from.username,
        },
      },
      { upsert: true, new: true }
    );
    await ctx.reply(
      `Hey! ${from.first_name}, welcome. I will be writing highly engaging social media posts for you, just keep feeding me with the events through out the day, Let'S shine on social media.`
    );
  } catch (error) {
    console.log(err);
    await ctx.reply("Facing diffiulties");
  }
});

bot.command("generate", async (ctx) => {
  const from = ctx.update.message.from;
  const { message_id: waitingMessageId } = await ctx.reply(
    `Hey,${from.first_name}, kindly wait for a moment, I am curating posts for you!!`
  );

  const { message_id: loadingStickerId } = await ctx.replyWithSticker(
    "CAACAgIAAxkBAAMwZkYOEjTSj8dLsQd2E7MJX7MvLqkAAhgAA8A2TxPW-ie_nGoY-DUE"
  );
  const startofDay = new Date();
  startofDay.setHours(0, 0, 0, 0);
  const endOfTheDay = new Date();
  endOfTheDay.setHours(23, 59, 59, 999);
  //get events for the user
  const events = await eventModel.find({
    tgId: from.id,
    createdAt: {
      $gte: startofDay,
      $lte: endOfTheDay,
    },
  });
  if (events.length === 0) {
    await ctx.deleteMessage(waitingMessageId);
    await ctx.deleteMessage(loadingStickerId);
    await ctx.reply("No events for the day..");
    return;
  }
  // console.log("events", events)
  // make openai api call
  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Act as senior copywritter, you write highly engaging posts for linkdin, facebook and twitter using provided thought/events through out the day.",
        },
        {
          role: "user",
          content: `As the user, provide a brief summary of your day's events. Use backticks to enclose the content, and template literals to insert events dynamically. Use the map() function to loop through the events and join them into a single string with appropriate punctuation. Ensure each event is represented as an object with a "text" property containing its description. Your generated text will be used to create engaging social media posts.
                    ${events.map((event) => event.text).join(",")}`,
        },
      ],
      model: process.env.OPENAI_MODEL,
    });

    await userModel.findOneAndUpdate(
      {
        tgId: from.id,
      },
      {
        $inc: {
          promptTokens: chatCompletion.usage.prompt_tokens,
          completionsToken: chatCompletion.usage.completion_tokens,
        },
      }
    );

    console.log("completion: ", chatCompletion);
    await ctx.deleteMessage(waitingMessageId);
    await ctx.deleteMessage(loadingStickerId);
    await ctx.reply(chatCompletion.choices[0].message.content);
  } catch (error) {
    await ctx.deleteMessage(waitingMessageId);
    await ctx.deleteMessage(loadingStickerId);
    await ctx.reply("Facing difficulties with openai");
    console.log(error);
  }
  // store token count
  // send response
});

// bot.on(message("sticker"), (ctx) => {
//   console.log("sticker", ctx.update.message);
// });
bot.on(message("text"), async (ctx) => {
  const from = ctx.update.message.from;
  const message = ctx.update.message.text;
  try {
    await eventModel.create({
      text: message,
      tgId: from.id,
    });
    await ctx.reply(
      "Noted, Keep texting me your thoughts, to generate the posts, just enter the command: /generate"
    );
  } catch (error) {
    console.log(error);
    await ctx.reply("Facing difficulties, please try again later..");
  }
});

bot.launch();
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
