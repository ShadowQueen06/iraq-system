const { EmbedBuilder } = require("discord.js");
const config = require("../config");

module.exports = async (oldMessage, newMessage) => {
  if (!oldMessage.guild) return;
  if (oldMessage.author?.bot) return;

  if (oldMessage.partial) await oldMessage.fetch().catch(() => null);
  if (newMessage.partial) await newMessage.fetch().catch(() => null);

  if (!oldMessage.content || !newMessage.content) return;
  if (oldMessage.content === newMessage.content) return;

  const logChannel = oldMessage.guild.channels.cache.get(config.channels.messageLogs);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor(config.colors.warning)
    .setTitle("✏️ تم تعديل رسالة")
    .setThumbnail(oldMessage.author.displayAvatarURL())
    .addFields(
      {
        name: "👤 العضو",
        value: `${oldMessage.author}`,
        inline: true
      },
      {
        name: "📍 الروم",
        value: `${oldMessage.channel}`,
        inline: true
      },
      {
        name: "قبل التعديل",
        value: oldMessage.content.substring(0, 1024)
      },
      {
        name: "بعد التعديل",
        value: newMessage.content.substring(0, 1024)
      }
    )
    .setTimestamp()
    .setFooter({ text: config.serverName });

  await logChannel.send({ embeds: [embed] });
};
