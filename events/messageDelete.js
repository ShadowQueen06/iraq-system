const { EmbedBuilder } = require("discord.js");
const config = require("../config");

module.exports = async (message) => {
  if (!message.guild) return;
  if (message.author?.bot) return;

  const logChannel = message.guild.channels.cache.get(config.channels.messageLogs);
  if (!logChannel) return;

  const content = message.content || "لا يوجد نص في الرسالة.";

  const embed = new EmbedBuilder()
    .setColor(config.colors.red)
    .setTitle("🗑️ تم حذف رسالة")
    .setThumbnail(message.author?.displayAvatarURL())
    .addFields(
      { name: "👤 العضو", value: `${message.author || "غير معروف"}`, inline: true },
      { name: "📍 الروم", value: `${message.channel}`, inline: true },
      { name: "💬 محتوى الرسالة", value: content.substring(0, 1024) }
    )
    .setTimestamp()
    .setFooter({ text: config.serverName });

  const firstAttachment = message.attachments?.first();
  if (firstAttachment?.url) {
    embed.addFields({ name: "📎 مرفق", value: firstAttachment.url.substring(0, 1024) });
    if (firstAttachment.contentType?.startsWith("image/")) embed.setImage(firstAttachment.url);
  }

  await logChannel.send({ embeds: [embed] });
};
