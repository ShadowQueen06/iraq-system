const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits
} = require("discord.js");

const config = require("../config");

const HIGH_STAFF_ROLE_ID = "1523447592380268544";

let ticketNumber = 1;

module.exports = async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName !== "ticket-panel") return;

    const embed = new EmbedBuilder()
      .setColor(config.colors.gold)
      .setTitle("🎫 العراق العظيم")
      .setDescription("اختر نوع التذكرة من القائمة بالأسفل.");

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket_select")
      .setPlaceholder("اختر نوع التذكرة")
      .addOptions(
        {
          label: "شكوى",
          value: "complaint",
          emoji: "📩"
        },
        {
          label: "شراء",
          value: "purchase",
          emoji: "🛒"
        },
        {
          label: "دعم فني",
          value: "support",
          emoji: "🛠️"
        },
        {
          label: "استفسار",
          value: "question",
          emoji: "❓"
        },
        {
          label: "شراكة",
          value: "partnership",
          emoji: "🤝"
        }
      );

    return interaction.reply({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(menu)]
    });
  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId !== "ticket_select") return;

    const types = {
      complaint: { name: "شكوى", emoji: "📩", prefix: "شكوى" },
      purchase: { name: "شراء", emoji: "🛒", prefix: "شراء" },
      support: { name: "دعم فني", emoji: "🛠️", prefix: "دعم" },
      question: { name: "استفسار", emoji: "❓", prefix: "استفسار" },
      partnership: { name: "شراكة", emoji: "🤝", prefix: "شراكة" }
    };

    const type = types[interaction.values[0]];
    const number = String(ticketNumber++).padStart(4, "0");

    const channel = await interaction.guild.channels.create({
      name: `${type.prefix}-${number}`,
      type: ChannelType.GuildText,
      parent: "1523399598817673347",
      topic: `ticket-owner:${interaction.user.id};claimed:false`,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
          ]
        },
        {
          id: HIGH_STAFF_ROLE_ID,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
          ]
        }
      ]
    });

    const embed = new EmbedBuilder()
      .setColor(config.colors.green)
      .setTitle("🎫 تذكرة جديدة")
      .addFields(
        { name: "👤 العضو", value: `${interaction.user}`, inline: true },
        { name: "📂 النوع", value: `${type.emoji} ${type.name}`, inline: true },
        { name: "🆔 رقم التذكرة", value: `#${number}`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: config.serverName });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("claim_ticket")
        .setLabel("استلام")
        .setEmoji("👑")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("إغلاق")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("delete_ticket")
        .setLabel("حذف")
        .setEmoji("🗑️")
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: `<@&${HIGH_STAFF_ROLE_ID}>\n🎫 تم فتح تذكرة جديدة.`,
      embeds: [embed],
      components: [row]
    });

    return interaction.reply({
      content: `تم فتح تذكرتك: ${channel}`,
      ephemeral: true
    });
  }

  if (interaction.isButton()) {
    if (interaction.customId === "claim_ticket") {
      if (interaction.channel.topic?.includes("claimed:true")) {
        return interaction.reply({
          content: "❌ هذه التذكرة مستلمة بالفعل.",
          ephemeral: true
        });
      }

      await interaction.channel.setTopic(
        `${interaction.channel.topic};claimed:true;claimedBy:${interaction.user.id}`
      );

      return interaction.reply(`👑 تم استلام التذكرة بواسطة ${interaction.user}`);
    }

    if (interaction.customId === "close_ticket") {
      const ownerId = interaction.channel.topic
        ?.split(";")[0]
        ?.replace("ticket-owner:", "");

      if (ownerId) {
        await interaction.channel.permissionOverwrites.edit(ownerId, {
          SendMessages: false
        });
      }

      return interaction.reply("🔒 تم إغلاق التذكرة.");
    }

    if (interaction.customId === "delete_ticket") {
      await interaction.reply("🗑️ سيتم حذف التذكرة بعد 5 ثواني.");

      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 5000);
    }
  }
};
