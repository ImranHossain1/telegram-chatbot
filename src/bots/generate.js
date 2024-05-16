import eventModel from "../models/Event.js";
import openai from "../config/openai.js";

export async function generate(ctx) {
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
}
