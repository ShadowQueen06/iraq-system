const { EmbedBuilder } = require("discord.js");
const config = require("../config");

module.exports = async (ban) => {
  const logChannel = ban.guild.channels.cache.get(config.channels.modLogs);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor(config.colors.green)
    .setTitle("✅ تم فك الحظر عن عضو")
    .setThumbnail(ban.user.displayAvatarURL())
    .addFields(
      { name: "👤 العضو", value: `${ban.user.tag}`, inline: true },
      { name: "🆔 ID", value: ban.user.id, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: config.serverName });

  await logChannel.send({ embeds: [embed] });
};
