const {
  Client,
  GatewayIntentBits,
  Partials
} = require("discord.js");

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

const {
  sendPanel,
  handleInteraction
} = require("./events/verification");

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
  await moderationCommands(message);
  await sendPanel(message);
});

client.on("interactionCreate", async interaction => {
  await interactionCreate(interaction);
  await handleInteraction(interaction);
});

client.on("voiceStateUpdate", voiceStateUpdate);
client.on("guildMemberAdd", guildMemberAdd);
client.on("guildMemberRemove", guildMemberRemove);
client.on("guildBanAdd", guildBanAdd);
client.on("guildBanRemove", guildBanRemove);
client.on("guildMemberUpdate", guildMemberUpdate);

client.login(process.env.TOKEN);
