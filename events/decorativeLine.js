const { AttachmentBuilder } = require("discord.js");
const path = require("path");

module.exports = async message => {
  if (!message.guild || message.author.bot) return;
  if (message.content.trim() !== "خط") return;

  await message.delete().catch(() => {});

  const imagePath = path.join(
    __dirname,
    "../assets/gold-line.png"
  );

  const line = new AttachmentBuilder(imagePath, {
    name: "gold-line.png"
  });

  await message.channel.send({
    files: [line]
  });
};
