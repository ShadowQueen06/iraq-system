const { EmbedBuilder, AuditLogEvent } = require("discord.js");
const config = require("../config");

async function getKickExecutor(guild, memberId) {
  try {
    const logs = await guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberKick });
    const entry = logs.entries.find(e => e.target?.id === memberId && Date.now() - e.createdTimestamp < 5000);
    return entry || null;
  } catch {
    return null;
  }
}

module.exports = async (member) => {
  if (member.user.bot) return;

  const kickEntry = await getKickExecutor(member.guild, member.id);

  if (kickEntry) {
    const logChannel = member.guild.channels.cache.get(config.channels.modLogs);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(config.colors.red)
      .setTitle("👟 تم طرد عضو")
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: "👤 العضو", value: `${member.user.tag}`, inline: true },
        { name: "👮 بواسطة", value: `${kickEntry.executor}`, inline: true },
        { name: "📝 السبب", value: kickEntry.reason || "لا يوجد سبب" }
      )
      .setTimestamp()
      .setFooter({ text: config.serverName });

    return logChannel.send({ embeds: [embed] });
  }

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
