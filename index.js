const {
  Client,
  GatewayIntentBits,
  Partials
} = require("discord.js");

const mongoose = require("mongoose");

const messageDelete = require("./events/messageDelete");
const messageUpdate = require("./events/messageUpdate");
const voiceStateUpdate = require("./events/voiceStateUpdate");
const guildMemberAdd = require("./events/guildMemberAdd");
const guildMemberRemove = require("./events/guildMemberRemove");
const guildBanAdd = require("./events/guildBanAdd");
const guildBanRemove = require("./events/guildBanRemove");
const guildMemberUpdate = require("./events/guildMemberUpdate");

const moderationCommands = require("./events/moderationCommands");
const interactionCreate = require("./events/interactionCreate");
const decorativeLine = require("./events/decorativeLine");
const economy = require("./events/economy");
const colors = require("./events/colors");

const {
  sendVerificationPanel,
  handleVerificationInteraction
} = require("./events/verification");

const {
  sendShopPanel,
  handleShopInteraction
} = require("./events/shop");

// رومات التفاعل التلقائي
const REACTION_CHANNEL_IDS = [
  "1527475569820827648", // روم الأذكار
  "1527478035044110407"  // روم الأشعار
];

// أسماء الإيموجيات حسب الترتيب
const REACTION_EMOJI_NAMES = [
  "GI_white",
  "GI_greystars",
  "GI_whiteheart"
];

if (!process.env.TOKEN) {
  throw new Error("TOKEN is missing.");
}

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is missing.");
}

const TOKEN = process.env.TOKEN.trim();
const MONGO_URI = process.env.MONGO_URI.trim();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ],

  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.GuildMember,
    Partials.User
  ]
});

// عند اشتغال البوت
client.once("clientReady", readyClient => {
  console.log("==================================");
  console.log(`${readyClient.user.tag} is online.`);
  console.log("IRAQ SYSTEM is ready.");
  console.log("==================================");
});

// حذف وتعديل الرسائل
client.on("messageDelete", messageDelete);
client.on("messageUpdate", messageUpdate);

// استقبال الرسائل
client.on("messageCreate", async message => {
  try {
    // تجاهل الخاص والبوتات
    if (!message.guild) return;
    if (message.author.bot) return;

    // أنظمة البوت الحالية
    await moderationCommands(message);
    await sendVerificationPanel(message);
    await decorativeLine(message);
    await economy(message);
    await colors.sendPanel(message);
    await sendShopPanel(message);

    // التفاعل التلقائي في روم الأذكار والأشعار
    if (REACTION_CHANNEL_IDS.includes(message.channel.id)) {
      for (const emojiName of REACTION_EMOJI_NAMES) {
        const emoji = message.guild.emojis.cache.find(
          guildEmoji => guildEmoji.name === emojiName
        );

        if (!emoji) {
          console.error(`Emoji not found: ${emojiName}`);
          continue;
        }

        try {
          await message.react(emoji);
        } catch (error) {
          console.error(
            `Failed to react with ${emojiName}:`,
            error.message
          );
        }
      }
    }
  } catch (error) {
    console.error("Message event error:", error);
  }
});

// الأزرار والتفاعلات
client.on("interactionCreate", async interaction => {
  try {
    await interactionCreate(interaction);

    if (!interaction.replied && !interaction.deferred) {
      await handleVerificationInteraction(interaction);
    }

    if (!interaction.replied && !interaction.deferred) {
      await handleShopInteraction(interaction);
    }
  } catch (error) {
    console.error("Interaction event error:", error);
  }
});

// بقية الأحداث
client.on("voiceStateUpdate", voiceStateUpdate);
client.on("guildMemberAdd", guildMemberAdd);
client.on("guildMemberRemove", guildMemberRemove);
client.on("guildBanAdd", guildBanAdd);
client.on("guildBanRemove", guildBanRemove);
client.on("guildMemberUpdate", guildMemberUpdate);

// منع توقف البوت بسبب خطأ غير متوقع
process.on("unhandledRejection", error => {
  console.error("Unhandled rejection:", error);
});

process.on("uncaughtException", error => {
  console.error("Uncaught exception:", error);
});

// الانتظار
function wait(milliseconds) {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}

// تسجيل الدخول مع إعادة المحاولة
async function loginWithRetry() {
  let attempt = 0;

  while (true) {
    attempt++;

    try {
      console.log(`Discord login attempt ${attempt}...`);

      await client.login(TOKEN);

      console.log("Discord login successful.");
      return;
    } catch (error) {
      console.error(
        `Discord login attempt ${attempt} failed:`,
        error.message
      );

      const delay = Math.min(attempt * 15000, 60000);

      console.log(
        `Retrying Discord login after ${delay / 1000} seconds...`
      );

      await wait(delay);
    }
  }
}

// تشغيل البوت
async function startBot() {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected.");

    await loginWithRetry();
  } catch (error) {
    console.error("Bot startup error:", error);

    console.log("Restarting startup after 30 seconds...");

    await wait(30000);

    startBot();
  }
}

startBot();
