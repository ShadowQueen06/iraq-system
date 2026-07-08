const { Client, GatewayIntentBits, Partials } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [
    Partials.Channel,
    Partials.Message
  ]
});

client.once("ready", () => {
  console.log("==================================");
  console.log(`${client.user.tag} is online.`);
  console.log("IRAQ SYSTEM is ready.");
  console.log("==================================");
});

client.login(process.env.TOKEN);
