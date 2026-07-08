const { EmbedBuilder } = require("discord.js");
const config = require("../config");

module.exports = async (message) => {
  if (!message.guild) return;
  if (message.author?.bot) return;
  if (!message.content) return;

  const logChannel = message.guild.channels.cache.get(config.channels.messageLogs);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor(config.colors.danger)
    .setTitle("🗑️ تم حذف رسالة")
    .setThumbnail(message.author.displayAvatarURL())
    .addFields(
      {
        name: "👤 العضو",
        value: `${message.author}`,
        inline: true
      },
      {
        name: "📍 الروم",
        value: `${message.channel}`,
        inline: true
      },
      {
        name: "💬 محتوى الرسالة",
        value: message.content.substring(0, 1024)
      }
    )
    .setTimestamp()
    .setFooter({ text: config.serverName });

  await logChannel.send({ embeds: [embed] });
};
