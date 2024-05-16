import userModel from "../models/User.js";

export async function start(ctx) {
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
}
