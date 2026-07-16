const { EmbedBuilder } = require("discord.js");
const Economy = require("../models/Economy");

const REWARD_CHANNEL_ID = "1523399598817673353";
const COMMAND_CHANNEL_ID = "1527062073262215250";

const REWARD_COOLDOWN = 60 * 1000;
const MIN_REWARD = 5;
const MAX_REWARD = 15;

function randomReward() {
  return Math.floor(
    Math.random() * (MAX_REWARD - MIN_REWARD + 1)
  ) + MIN_REWARD;
}

function formatCoins(amount) {
  return Number(amount).toLocaleString("en-US");
}

async function getAccount(guildId, userId) {
  return Economy.findOneAndUpdate(
    {
      guildId,
      userId
    },
    {
      $setOnInsert: {
        guildId,
        userId,
        balance: 0
      }
    },
    {
      new: true,
      upsert: true
    }
  );
}

async function rewardMember(message) {
  if (message.channel.id !== REWARD_CHANNEL_ID) return;

  const account = await getAccount(
    message.guild.id,
    message.author.id
  );

  const now = Date.now();
  const lastReward = account.lastRewardAt
    ? account.lastRewardAt.getTime()
    : 0;

  if (now - lastReward < REWARD_COOLDOWN) return;

  const reward = randomReward();

  account.balance += reward;
  account.lastRewardAt = new Date(now);

  await account.save();
}

async function showBalance(message) {
  const target =
    message.mentions.users.first() || message.author;

  if (target.bot) {
    return message.reply("البوتات ما عدها GI Coins.");
  }

  const account = await getAccount(
    message.guild.id,
    target.id
  );

  const embed = new EmbedBuilder()
    .setColor("#D4AF37")
    .setTitle("GI Coins")
    .setDescription(
      target.id === message.author.id
        ? `رصيدك الحالي هو **${formatCoins(account.balance)} GI Coins**`
        : `رصيد ${target} هو **${formatCoins(account.balance)} GI Coins**`
    )
    .setThumbnail(
      target.displayAvatarURL({
        size: 256
      })
    )
    .setFooter({
      text: "Great Iraq • Economy"
    });

  await message.reply({
    embeds: [embed],
    allowedMentions: {
      repliedUser: false
    }
  });
}

async function showTop(message) {
  const accounts = await Economy.find({
    guildId: message.guild.id,
    balance: {
      $gt: 0
    }
  })
    .sort({
      balance: -1
    })
    .limit(10)
    .lean();

  if (!accounts.length) {
    return message.reply("ماكو أعضاء عندهم GI Coins حاليًا.");
  }

  const lines = [];

  for (let index = 0; index < accounts.length; index++) {
    const account = accounts[index];

    const user = await message.client.users
      .fetch(account.userId)
      .catch(() => null);

    const name = user
      ? user.username
      : "عضو غير موجود";

    lines.push(
      `**${index + 1}.** ${name} — **${formatCoins(account.balance)} GI Coins**`
    );
  }

  const embed = new EmbedBuilder()
    .setColor("#D4AF37")
    .setTitle("توب GI Coins")
    .setDescription(lines.join("\n"))
    .setFooter({
      text: "Great Iraq • Top 10"
    });

  await message.reply({
    embeds: [embed],
    allowedMentions: {
      repliedUser: false
    }
  });
}

async function transferCoins(message) {
  const target = message.mentions.users.first();

  const parts = message.content
    .trim()
    .split(/\s+/);

  const amountText = parts.find(part =>
    /^\d+$/.test(part)
  );

  const amount = Number(amountText);

  if (!target || !Number.isSafeInteger(amount) || amount <= 0) {
    return message.reply(
      "استخدم الأمر بهذا الشكل:\n`تحويل @العضو 100`"
    );
  }

  if (target.bot) {
    return message.reply("ما تگدر تحول GI Coins إلى بوت.");
  }

  if (target.id === message.author.id) {
    return message.reply("ما تگدر تحول لنفسك.");
  }

  const sender = await getAccount(
    message.guild.id,
    message.author.id
  );

  if (sender.balance < amount) {
    return message.reply(
      `رصيدك ما يكفي. رصيدك الحالي **${formatCoins(sender.balance)} GI Coins**.`
    );
  }

  const receiver = await getAccount(
    message.guild.id,
    target.id
  );

  sender.balance -= amount;
  receiver.balance += amount;

  await sender.save();
  await receiver.save();

  const embed = new EmbedBuilder()
    .setColor("#57F287")
    .setTitle("تم التحويل")
    .setDescription(
      [
        `${message.author} حول إلى ${target}`,
        "",
        `المبلغ: **${formatCoins(amount)} GI Coins**`,
        `رصيدك الجديد: **${formatCoins(sender.balance)} GI Coins**`
      ].join("\n")
    )
    .setFooter({
      text: "Great Iraq • Transfer"
    });

  await message.reply({
    embeds: [embed],
    allowedMentions: {
      repliedUser: false
    }
  });
}

module.exports = async message => {
  if (!message.guild || message.author.bot) return;

  await rewardMember(message);

  if (message.channel.id !== COMMAND_CHANNEL_ID) return;

  const content = message.content.trim();

  if (
    content === "رصيدي" ||
    content.startsWith("رصيدي ")
  ) {
    await showBalance(message);
    return;
  }

  if (content === "توب") {
    await showTop(message);
    return;
  }

  if (content.startsWith("تحويل ")) {
    await transferCoins(message);
  }
};
