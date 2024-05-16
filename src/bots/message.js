import eventModel from "../models/Event.js";

export async function handleMessage(ctx) {
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
}
