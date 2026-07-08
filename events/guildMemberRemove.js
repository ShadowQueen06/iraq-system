const { EmbedBuilder } = require("discord.js");
const config = require("../config");

module.exports = async (member) => {
  if (member.user.bot) return;

  const logChannel = member.guild.channels.cache.get(config.channels.memberLogs);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor(config.colors.red)
    .setTitle("📤 عضو غادر السيرفر")
    .setThumbnail(member.user.displayAvatarURL())
    .addFields(
      { name: "👤 العضو", value: `${member.user.tag}`, inline: true },
      { name: "🆔 ID", value: member.id, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: config.serverName });

  await logChannel.send({ embeds: [embed] });
};
