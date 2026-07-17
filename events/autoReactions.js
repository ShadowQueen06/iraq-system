const REACTION_CHANNEL_IDS = [
  "1527475569820827648",
  "1527478035044110407"
];

const REACTION_EMOJI_NAMES = [
  "GI_white",
  "GI_greystars",
  "GI_whiteheart"
];

module.exports = async message => {
  if (!message.guild) return;
  if (message.author.bot) return;

  if (!REACTION_CHANNEL_IDS.includes(message.channel.id)) {
    return;
  }

  for (const emojiName of REACTION_EMOJI_NAMES) {
    const emoji = message.guild.emojis.cache.find(
      serverEmoji => serverEmoji.name === emojiName
    );

    if (!emoji) {
      console.error(`Emoji not found: ${emojiName}`);
      continue;
    }

    await message.react(emoji).catch(error => {
      console.error(`Failed to react with ${emojiName}:`, error);
    });
  }
};
