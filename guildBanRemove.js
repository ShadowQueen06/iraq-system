const { EmbedBuilder, AuditLogEvent } = require("discord.js");
const config = require("../config");

module.exports = async (ban) => {
  const logChannel = ban.guild.channels.cache.get(config.channels.modLogs);
  if (!logChannel) return;

  let executor = null;

  try {
    const logs = await ban.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberBanRemove });
    const entry = logs.entries.find(e => e.target?.id === ban.user.id && Date.now() - e.createdTimestamp < 5000);
    if (entry) executor = entry.executor;
  } catch {}

  const embed = new EmbedBuilder()
    .setColor(config.colors.green)
    .setTitle("✅ تم فك الحظر عن عضو")
    .setThumbnail(ban.user.displayAvatarURL())
    .addFields(
      { name: "👤 العضو", value: `${ban.user.tag}`, inline: true },
      { name: "👮 بواسطة", value: executor ? `${executor}` : "غير معروف", inline: true }
    )
    .setTimestamp()
    .setFooter({ text: config.serverName });

  await logChannel.send({ embeds: [embed] });
};
