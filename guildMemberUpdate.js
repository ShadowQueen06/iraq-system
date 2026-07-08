const { EmbedBuilder, AuditLogEvent } = require("discord.js");
const config = require("../config");

async function getTimeoutExecutor(guild, memberId) {
  try {
    const logs = await guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberUpdate });
    const entry = logs.entries.find(e => e.target?.id === memberId && Date.now() - e.createdTimestamp < 5000);
    return entry || null;
  } catch {
    return null;
  }
}

module.exports = async (oldMember, newMember) => {
  if (newMember.user.bot) return;

  if (oldMember.nickname !== newMember.nickname) {
    const logChannel = newMember.guild.channels.cache.get(config.channels.messageLogs);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(config.colors.yellow)
      .setTitle("📝 تم تغيير Nickname")
      .setThumbnail(newMember.user.displayAvatarURL())
      .addFields(
        { name: "👤 العضو", value: `${newMember}`, inline: true },
        { name: "قبل", value: oldMember.nickname || oldMember.user.username },
        { name: "بعد", value: newMember.nickname || newMember.user.username }
      )
      .setTimestamp()
      .setFooter({ text: config.serverName });

    await logChannel.send({ embeds: [embed] });
  }

  const oldTimeout = oldMember.communicationDisabledUntilTimestamp;
  const newTimeout = newMember.communicationDisabledUntilTimestamp;

  if (!oldTimeout && newTimeout) {
    const logChannel = newMember.guild.channels.cache.get(config.channels.modLogs);
    if (!logChannel) return;

    const entry = await getTimeoutExecutor(newMember.guild, newMember.id);

    const embed = new EmbedBuilder()
      .setColor(config.colors.yellow)
      .setTitle("⏳ تم إعطاء Timeout")
      .setThumbnail(newMember.user.displayAvatarURL())
      .addFields(
        { name: "👤 العضو", value: `${newMember}`, inline: true },
        { name: "👮 بواسطة", value: entry?.executor ? `${entry.executor}` : "غير معروف", inline: true },
        { name: "ينتهي في", value: `<t:${Math.floor(newTimeout / 1000)}:R>` }
      )
      .setTimestamp()
      .setFooter({ text: config.serverName });

    await logChannel.send({ embeds: [embed] });
  }

  if (oldTimeout && !newTimeout) {
    const logChannel = newMember.guild.channels.cache.get(config.channels.modLogs);
    if (!logChannel) return;

    const entry = await getTimeoutExecutor(newMember.guild, newMember.id);

    const embed = new EmbedBuilder()
      .setColor(config.colors.green)
      .setTitle("⌛ تم إزالة Timeout")
      .setThumbnail(newMember.user.displayAvatarURL())
      .addFields(
        { name: "👤 العضو", value: `${newMember}`, inline: true },
        { name: "👮 بواسطة", value: entry?.executor ? `${entry.executor}` : "غير معروف", inline: true }
      )
      .setTimestamp()
      .setFooter({ text: config.serverName });

    await logChannel.send({ embeds: [embed] });
  }
};
