const fs = require("fs");
const path = require("path");
const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const config = require("../config");

const WARNINGS_PATH = path.join(__dirname, "..", "data", "warnings.json");

function normalizeCommand(command) {
  return command.replace(/\uFE0F/g, "").toLowerCase();
}

function readWarnings() {
  try {
    if (!fs.existsSync(WARNINGS_PATH)) return {};
    return JSON.parse(fs.readFileSync(WARNINGS_PATH, "utf8"));
  } catch {
    return {};
  }
}

function saveWarnings(data) {
  fs.mkdirSync(path.dirname(WARNINGS_PATH), { recursive: true });
  fs.writeFileSync(WARNINGS_PATH, JSON.stringify(data, null, 2));
}

function parseDuration(input) {
  if (!input) return null;

  const text = input.toLowerCase();
  const match = text.match(/^(\d+)(s|m|h|d|ث|د|س|ي)$/i);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2];

  if (!amount || amount < 1) return null;

  const multipliers = {
    s: 1000,
    "ث": 1000,
    m: 60 * 1000,
    "د": 60 * 1000,
    h: 60 * 60 * 1000,
    "س": 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    "ي": 24 * 60 * 60 * 1000
  };

  const ms = amount * multipliers[unit];
  const max = 28 * 24 * 60 * 60 * 1000;

  if (ms > max) return max;
  return ms;
}

function getTarget(message, args) {
  const mentioned = message.mentions.members.first();
  if (mentioned) return mentioned;

  const id = args[0]?.replace(/[<@!>]/g, "");
  if (!id) return null;

  return message.guild.members.cache.get(id) || null;
}

function getReason(args, startIndex, fallback = "لا يوجد سبب") {
  const reason = args.slice(startIndex).join(" ").trim();
  return reason || fallback;
}

function canModerate(message, permission) {
  if (!message.member.permissions.has(permission)) {
    message.reply("ما عندك صلاحية تستخدم هذا الأمر.").catch(() => {});
    return false;
  }

  if (!message.guild.members.me.permissions.has(permission)) {
    message.reply("البوت ما عنده الصلاحية المطلوبة.").catch(() => {});
    return false;
  }

  return true;
}

function canActOn(message, target) {
  if (!target) {
    message.reply("منشن العضو أو اكتب آيديه.").catch(() => {});
    return false;
  }

  if (target.id === message.author.id) {
    message.reply("ما تقدر تستخدم الأمر على نفسك.").catch(() => {});
    return false;
  }

  if (target.id === message.guild.ownerId) {
    message.reply("ما أقدر أطبق الأمر على صاحب السيرفر.").catch(() => {});
    return false;
  }

  if (target.roles.highest.position >= message.member.roles.highest.position && message.guild.ownerId !== message.author.id) {
    message.reply("ما تقدر تطبق الأمر على عضو رتبته أعلى أو مساوية لرتبتك.").catch(() => {});
    return false;
  }

  if (target.roles.highest.position >= message.guild.members.me.roles.highest.position) {
    message.reply("رتبة العضو أعلى أو مساوية لرتبة البوت.").catch(() => {});
    return false;
  }

  return true;
}

async function sendModLog(guild, embed) {
  const logChannel = guild.channels.cache.get(config.channels.modLogs);
  if (!logChannel) return;
  await logChannel.send({ embeds: [embed] }).catch(() => {});
}

module.exports = async (message) => {
  if (!message.guild) return;
  if (message.author.bot) return;

  const parts = message.content.trim().split(/\s+/);
  const command = normalizeCommand(parts[0] || "");
  const args = parts.slice(1);

  const banCommands = ["🩴", "دي", "حضر", "باند", "ban"];
  const kickCommands = ["👟", "طرد", "كيك", "kick"];
  const timeoutCommands = ["⏳", "تايم", "timeout"];
  const warnCommands = ["⚠", "تحذير", "warn"];
  const clearCommands = ["🧹", "مسح", "clear"];
  const nickCommands = ["📝", "اسم", "nick", "nickname"];

  try {
    if (banCommands.includes(command)) {
      if (!canModerate(message, PermissionFlagsBits.BanMembers)) return;
      const target = getTarget(message, args);
      if (!canActOn(message, target)) return;

      const reason = getReason(args, 1);
      await target.ban({ reason: `${reason} | بواسطة ${message.author.tag}` });
      return message.reply(`🩴 تم حظر ${target.user.tag}`).catch(() => {});
    }

    if (kickCommands.includes(command)) {
      if (!canModerate(message, PermissionFlagsBits.KickMembers)) return;
      const target = getTarget(message, args);
      if (!canActOn(message, target)) return;

      const reason = getReason(args, 1);
      await target.kick(`${reason} | بواسطة ${message.author.tag}`);
      return message.reply(`👟 تم طرد ${target.user.tag}`).catch(() => {});
    }

    if (timeoutCommands.includes(command)) {
      if (!canModerate(message, PermissionFlagsBits.ModerateMembers)) return;
      const target = getTarget(message, args);
      if (!canActOn(message, target)) return;

      const duration = parseDuration(args[1]);
      if (!duration) {
        return message.reply("اكتب المدة مثل: 10m أو 1h أو 1d").catch(() => {});
      }

      const reason = getReason(args, 2);
      await target.timeout(duration, `${reason} | بواسطة ${message.author.tag}`);
      return message.reply(`⏳ تم إعطاء Timeout إلى ${target.user.tag}`).catch(() => {});
    }

    if (warnCommands.includes(command)) {
      if (!canModerate(message, PermissionFlagsBits.ModerateMembers)) return;
      const target = getTarget(message, args);
      if (!canActOn(message, target)) return;

      const reason = getReason(args, 1);
      const data = readWarnings();
      const guildData = data[message.guild.id] || {};
      const userWarnings = guildData[target.id] || [];

      userWarnings.push({
        reason,
        moderatorId: message.author.id,
        moderatorTag: message.author.tag,
        createdAt: Date.now()
      });

      guildData[target.id] = userWarnings;
      data[message.guild.id] = guildData;
      saveWarnings(data);

      const embed = new EmbedBuilder()
        .setColor(config.colors.yellow)
        .setTitle("⚠️ تم إعطاء تحذير")
        .setThumbnail(target.user.displayAvatarURL())
        .addFields(
          { name: "👤 العضو", value: `${target}`, inline: true },
          { name: "👮 بواسطة", value: `${message.author}`, inline: true },
          { name: "📌 عدد التحذيرات", value: `${userWarnings.length}`, inline: true },
          { name: "📝 السبب", value: reason }
        )
        .setTimestamp()
        .setFooter({ text: config.serverName });

      await sendModLog(message.guild, embed);
      return message.reply(`⚠️ تم تحذير ${target.user.tag}`).catch(() => {});
    }

    if (clearCommands.includes(command)) {
      if (!canModerate(message, PermissionFlagsBits.ManageMessages)) return;

      const amount = Number(args[0]);
      if (!amount || amount < 1 || amount > 100) {
        return message.reply("اكتب رقم من 1 إلى 100.").catch(() => {});
      }

      const deleted = await message.channel.bulkDelete(amount, true);

      const embed = new EmbedBuilder()
        .setColor(config.colors.red)
        .setTitle("🧹 تم مسح رسائل")
        .addFields(
          { name: "👮 بواسطة", value: `${message.author}`, inline: true },
          { name: "📍 الروم", value: `${message.channel}`, inline: true },
          { name: "🔢 العدد", value: `${deleted.size}`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: config.serverName });

      await sendModLog(message.guild, embed);
      const reply = await message.channel.send(`🧹 تم مسح ${deleted.size} رسالة.`).catch(() => null);
      if (reply) setTimeout(() => reply.delete().catch(() => {}), 4000);
      return;
    }

    if (nickCommands.includes(command)) {
      if (!canModerate(message, PermissionFlagsBits.ManageNicknames)) return;
      const target = getTarget(message, args);
      if (!canActOn(message, target)) return;

      const nickname = args.slice(1).join(" ").trim();
      if (!nickname) {
        return message.reply("اكتب الاسم الجديد بعد المنشن.").catch(() => {});
      }

      await target.setNickname(nickname, `تغيير اسم بواسطة ${message.author.tag}`);
      return message.reply(`📝 تم تغيير اسم ${target.user.tag}`).catch(() => {});
    }
  } catch (error) {
    console.error(error);
    return message.reply("صار خطأ أثناء تنفيذ الأمر.").catch(() => {});
  }
};
