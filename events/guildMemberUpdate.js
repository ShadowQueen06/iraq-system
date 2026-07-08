const { EmbedBuilder } = require("discord.js");
const config = require("../config");

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

  if (!oldMember.communicationDisabledUntil && newMember.communicationDisabledUntil) {
    const logChannel = newMember.guild.channels.cache.get(config.channels.modLogs);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(config.colors.yellow)
      .setTitle("⏳ تم إعطاء Timeout")
      .setThumbnail(newMember.user.displayAvatarURL())
      .addFields(
        { name: "👤 العضو", value: `${newMember}`, inline: true },
        { name: "ينتهي في", value: `<t:${Math.floor(newMember.communicationDisabledUntilTimestamp / 1000)}:R>` }
      )
      .setTimestamp()
      .setFooter({ text: config.serverName });

    await logChannel.send({ embeds: [embed] });
  }

  if (oldMember.communicationDisabledUntil && !newMember.communicationDisabledUntil) {
    const logChannel = newMember.guild.channels.cache.get(config.channels.modLogs);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(config.colors.green)
      .setTitle("⌛ تم إزالة Timeout")
      .setThumbnail(newMember.user.displayAvatarURL())
      .addFields(
        { name: "👤 العضو", value: `${newMember}`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: config.serverName });

    await logChannel.send({ embeds: [embed] });
  }
};
