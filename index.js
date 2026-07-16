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

if (!process.env.TOKEN) {
  throw new Error("TOKEN is missing.");
}

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is missing.");
}

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

client.once("clientReady", () => {
  console.log("==================================");
  console.log(`${client.user.tag} is online.`);
  console.log("IRAQ SYSTEM is ready.");
  console.log("==================================");
});

client.on("messageDelete", messageDelete);

client.on("messageUpdate", messageUpdate);

client.on("messageCreate", async message => {
  try {
    await moderationCommands(message);
    await sendVerificationPanel(message);
    await decorativeLine(message);
    await economy(message);
    await colors.sendPanel(message);
  } catch (error) {
    console.error("Message event error:", error);
  }
});

client.on("interactionCreate", async interaction => {
  try {
    await interactionCreate(interaction);

    if (!interaction.replied && !interaction.deferred) {
      await handleVerificationInteraction(interaction);
    }
  } catch (error) {
    console.error("Interaction event error:", error);
  }
});

client.on("voiceStateUpdate", voiceStateUpdate);

client.on("guildMemberAdd", guildMemberAdd);

client.on("guildMemberRemove", guildMemberRemove);

client.on("guildBanAdd", guildBanAdd);

client.on("guildBanRemove", guildBanRemove);

client.on("guildMemberUpdate", guildMemberUpdate);

async function startBot() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected.");

    await client.login(process.env.TOKEN);
  } catch (error) {
    console.error("Bot startup error:", error);
    process.exit(1);
  }
}

startBot();
