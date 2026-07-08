const { EmbedBuilder, AuditLogEvent } = require("discord.js");
const config = require("../config");

async function getVoiceExecutor(guild, targetId) {
  try {
    const logs = await guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberDisconnect });
    const entry = logs.entries.find(e => Date.now() - e.createdTimestamp < 5000);
    return entry?.executor || null;
  } catch {
    return null;
  }
}

module.exports = async (oldState, newState) => {
  const logChannel = newState.guild.channels.cache.get(config.channels.voiceLogs);
  if (!logChannel) return;

  const member = newState.member || oldState.member;
  if (!member || member.user.bot) return;

  let title = null;
  let color = null;
  let fields = [];

  if (!oldState.channel && newState.channel) {
    title = "🎙️ دخل روم صوتي";
    color = config.colors.green;
    fields.push({ name: "🔊 الروم", value: `${newState.channel}`, inline: true });
  } else if (oldState.channel && !newState.channel) {
    const executor = await getVoiceExecutor(newState.guild, member.id);

    if (executor && executor.id !== member.id) {
      title = "👢 تم طرد عضو من الفويس";
      color = config.colors.red;
      fields.push(
        { name: "🔊 الروم", value: `${oldState.channel}`, inline: true },
        { name: "👮 بواسطة", value: `${executor}`, inline: true }
      );
    } else {
      title = "🚪 خرج من روم صوتي";
      color = config.colors.purple;
      fields.push({ name: "🔊 الروم", value: `${oldState.channel}`, inline: true });
    }
  } else if (oldState.channelId !== newState.channelId) {
    title = "🔄 انتقل بين الرومات الصوتية";
    color = config.colors.blue;
    fields.push(
      { name: "من", value: `${oldState.channel}`, inline: true },
      { name: "إلى", value: `${newState.channel}`, inline: true }
    );
  } else if (!oldState.serverMute && newState.serverMute) {
    title = "🔇 تم إعطاء Server Mute";
    color = config.colors.yellow;
  } else if (oldState.serverMute && !newState.serverMute) {
    title = "🔊 تم إزالة Server Mute";
    color = config.colors.green;
  } else if (!oldState.serverDeaf && newState.serverDeaf) {
    title = "🎧 تم إعطاء Server Deafen";
    color = config.colors.yellow;
  } else if (oldState.serverDeaf && !newState.serverDeaf) {
    title = "🎧 تم إزالة Server Deafen";
    color = config.colors.green;
  }

  if (!title) return;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setThumbnail(member.user.displayAvatarURL())
    .addFields(
      { name: "👤 العضو", value: `${member}`, inline: true },
      ...fields
    )
    .setTimestamp()
    .setFooter({ text: config.serverName });

  await logChannel.send({ embeds: [embed] });
};
