const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  MessageFlags
} = require("discord.js");

// روم تقديم التوثيق
const REQUEST_CHANNEL_ID = "1527040526036107455";

// روم لوق طلبات التوثيق
const LOG_CHANNEL_ID = "1527040584433274921";

// الرتب
const MISS_ROLE_ID = "1527011950993735681";
const PRINCESS_ROLE_ID = "1527012096892735729";

// الطلبات المفتوحة مؤقتًا
const pendingRequests = new Set();

function createDisabledButtons(components) {
  return components.map(row => {
    const disabledComponents = row.components.map(component =>
      ButtonBuilder.from(component).setDisabled(true)
    );

    return ActionRowBuilder.from(row).setComponents(disabledComponents);
  });
}

async function sendVerificationPanel(message) {
  if (!message.guild || message.author.bot) return;
  if (message.channel.id !== REQUEST_CHANNEL_ID) return;

  const command = message.content.trim().toLowerCase();

  if (
    command !== "لوحة توثيق" &&
    command !== "verification-panel"
  ) {
    return;
  }

  const isAllowed =
    message.author.id === message.guild.ownerId ||
    message.member.permissions.has(
      PermissionFlagsBits.Administrator
    );

  if (!isAllowed) {
    return message.reply("ما عندك صلاحية ترسل لوحة التوثيق.");
  }

  await message.delete().catch(() => {});

  const embed = new EmbedBuilder()
    .setColor("#D4AF37")
    .setTitle("Girls Verification")
    .setDescription(
      [
        "اضغطي على الزر بالأسفل حتى تقدمين طلب التوثيق.",
        "",
        "بعد إرسال الطلب، فريق التوثيق راح يراجعه.",
        "",
        "عند الموافقة:",
        "• تنضاف رتبة **Princess** تلقائيًا.",
        "• تنشال رتبة **Miss** تلقائيًا."
      ].join("\n")
    )
    .setFooter({
      text: "Great Iraq • Verification System"
    });

  const applyButton = new ButtonBuilder()
    .setCustomId("verification_apply")
    .setLabel("تقديم توثيق")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(applyButton);

  await message.channel.send({
    embeds: [embed],
    components: [row]
  });
}

async function showVerificationModal(interaction) {
  if (interaction.customId !== "verification_apply") return false;

  const member = await interaction.guild.members
    .fetch(interaction.user.id)
    .catch(() => null);

  if (!member) {
    await interaction.reply({
      content: "ما كدرت ألقى حسابك داخل السيرفر.",
      flags: MessageFlags.Ephemeral
    });

    return true;
  }

  if (member.roles.cache.has(PRINCESS_ROLE_ID)) {
    await interaction.reply({
      content: "أنتِ موثقة بالفعل وعندك رتبة Princess.",
      flags: MessageFlags.Ephemeral
    });

    return true;
  }

  if (!member.roles.cache.has(MISS_ROLE_ID)) {
    await interaction.reply({
      content: "لازم تكون عندك رتبة Miss حتى تقدمين على التوثيق.",
      flags: MessageFlags.Ephemeral
    });

    return true;
  }

  if (pendingRequests.has(interaction.user.id)) {
    await interaction.reply({
      content: "عندك طلب توثيق قيد المراجعة حاليًا.",
      flags: MessageFlags.Ephemeral
    });

    return true;
  }

  const modal = new ModalBuilder()
    .setCustomId("verification_form")
    .setTitle("تقديم طلب توثيق");

  const nameInput = new TextInputBuilder()
    .setCustomId("verification_name")
    .setLabel("الاسم")
    .setPlaceholder("اكتبي اسمك")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(2)
    .setMaxLength(50);

  const ageInput = new TextInputBuilder()
    .setCustomId("verification_age")
    .setLabel("العمر")
    .setPlaceholder("اكتبي عمرك بالأرقام")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(3);

  const locationInput = new TextInputBuilder()
    .setCustomId("verification_location")
    .setLabel("من وين؟")
    .setPlaceholder("الدولة أو المدينة")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);

  const interestsInput = new TextInputBuilder()
    .setCustomId("verification_interests")
    .setLabel("الاهتمامات")
    .setPlaceholder("مثال: ألعاب، سيارات، كرة قدم")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(500);

  modal.addComponents(
    new ActionRowBuilder().addComponents(nameInput),
    new ActionRowBuilder().addComponents(ageInput),
    new ActionRowBuilder().addComponents(locationInput),
    new ActionRowBuilder().addComponents(interestsInput)
  );

  await interaction.showModal(modal);

  return true;
}

async function submitVerificationForm(interaction) {
  if (interaction.customId !== "verification_form") return false;

  const logChannel = await interaction.guild.channels
    .fetch(LOG_CHANNEL_ID)
    .catch(() => null);

  if (!logChannel || !logChannel.isTextBased()) {
    await interaction.reply({
      content: "روم لوق التوثيق مو موجود أو البوت ما يقدر يشوفه.",
      flags: MessageFlags.Ephemeral
    });

    return true;
  }

  if (pendingRequests.has(interaction.user.id)) {
    await interaction.reply({
      content: "عندك طلب توثيق قيد المراجعة.",
      flags: MessageFlags.Ephemeral
    });

    return true;
  }

  const name = interaction.fields
    .getTextInputValue("verification_name")
    .trim();

  const age = interaction.fields
    .getTextInputValue("verification_age")
    .trim();

  const location = interaction.fields
    .getTextInputValue("verification_location")
    .trim();

  const interests = interaction.fields
    .getTextInputValue("verification_interests")
    .trim();

  if (!/^\d{1,3}$/.test(age)) {
    await interaction.reply({
      content: "العمر لازم يكون مكتوب بالأرقام فقط.",
      flags: MessageFlags.Ephemeral
    });

    return true;
  }

  pendingRequests.add(interaction.user.id);

  const embed = new EmbedBuilder()
    .setColor("#FEE75C")
    .setTitle("طلب توثيق جديد")
    .setThumbnail(
      interaction.user.displayAvatarURL({
        size: 256
      })
    )
    .addFields(
      {
        name: "العضوة",
        value: `${interaction.user}\n\`${interaction.user.id}\``
      },
      {
        name: "الاسم",
        value: name,
        inline: true
      },
      {
        name: "العمر",
        value: age,
        inline: true
      },
      {
        name: "من وين؟",
        value: location
      },
      {
        name: "الاهتمامات",
        value: interests
      },
      {
        name: "الحالة",
        value: "قيد المراجعة"
      }
    )
    .setTimestamp()
    .setFooter({
      text: "Great Iraq • Verification System"
    });

  const approveButton = new ButtonBuilder()
    .setCustomId(
      `verification_approve:${interaction.user.id}`
    )
    .setLabel("موافقة")
    .setStyle(ButtonStyle.Success);

  const rejectButton = new ButtonBuilder()
    .setCustomId(
      `verification_reject:${interaction.user.id}`
    )
    .setLabel("رفض")
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder().addComponents(
    approveButton,
    rejectButton
  );

  try {
    await logChannel.send({
      embeds: [embed],
      components: [row]
    });

    await interaction.reply({
      content:
        "تم إرسال طلبكِ. انتظري حتى يراجعه فريق التوثيق.",
      flags: MessageFlags.Ephemeral
    });
  } catch (error) {
    pendingRequests.delete(interaction.user.id);

    console.error("Verification submit error:", error);

    if (!interaction.replied) {
      await interaction.reply({
        content: "صار خطأ أثناء إرسال طلب التوثيق.",
        flags: MessageFlags.Ephemeral
      });
    }
  }

  return true;
}

async function handleVerificationDecision(interaction) {
  const isApprove = interaction.customId.startsWith(
    "verification_approve:"
  );

  const isReject = interaction.customId.startsWith(
    "verification_reject:"
  );

  if (!isApprove && !isReject) return false;

  const canReview =
    interaction.user.id === interaction.guild.ownerId ||
    interaction.member.permissions.has(
      PermissionFlagsBits.ManageRoles
    );

  if (!canReview) {
    await interaction.reply({
      content: "ما عندك صلاحية تراجعين طلبات التوثيق.",
      flags: MessageFlags.Ephemeral
    });

    return true;
  }

  const userId = interaction.customId.split(":")[1];

  const member = await interaction.guild.members
    .fetch(userId)
    .catch(() => null);

  if (!member) {
    pendingRequests.delete(userId);

    await interaction.reply({
      content: "العضوة طلعت من السيرفر أو حسابها مو موجود.",
      flags: MessageFlags.Ephemeral
    });

    return true;
  }

  await interaction.deferUpdate();

  const oldEmbed = interaction.message.embeds[0];

  if (!oldEmbed) return true;

  const disabledButtons = createDisabledButtons(
    interaction.message.components
  );

  const originalFields = oldEmbed.fields.slice(0, -1);

  if (isApprove) {
    try {
      if (!member.roles.cache.has(PRINCESS_ROLE_ID)) {
        await member.roles.add(
          PRINCESS_ROLE_ID,
          `Verification approved by ${interaction.user.tag}`
        );
      }

      if (member.roles.cache.has(MISS_ROLE_ID)) {
        await member.roles.remove(
          MISS_ROLE_ID,
          `Verification approved by ${interaction.user.tag}`
        );
      }

      const approvedEmbed = EmbedBuilder.from(oldEmbed)
        .setColor("#57F287")
        .setFields(
          ...originalFields,
          {
            name: "الحالة",
            value: `تمت الموافقة بواسطة ${interaction.user}`
          }
        );

      await interaction.message.edit({
        embeds: [approvedEmbed],
        components: disabledButtons
      });

      await member
        .send(
          [
            "تم قبول طلب التوثيق الخاص بكِ.",
            "",
            "تم منحكِ رتبة Princess وإزالة رتبة Miss.",
            "",
            "أهلًا بكِ في Great Iraq."
          ].join("\n")
        )
        .catch(() => {});

      pendingRequests.delete(userId);
    } catch (error) {
      console.error("Verification approval error:", error);

      await interaction.followUp({
        content:
          "ما كدرت أغير الرتب. خلي رتبة البوت أعلى من Miss وPrincess وتأكد من صلاحية Manage Roles.",
        flags: MessageFlags.Ephemeral
      });
    }

    return true;
  }

  const rejectedEmbed = EmbedBuilder.from(oldEmbed)
    .setColor("#ED4245")
    .setFields(
      ...originalFields,
      {
        name: "الحالة",
        value: `تم رفض الطلب بواسطة ${interaction.user}`
      }
    );

  await interaction.message.edit({
    embeds: [rejectedEmbed],
    components: disabledButtons
  });

  await member
    .send(
      [
        "تم رفض طلب التوثيق الخاص بكِ.",
        "",
        "إذا تعتقدين صار خطأ، افتحي تذكرة وتواصلي مع الإدارة."
      ].join("\n")
    )
    .catch(() => {});

  pendingRequests.delete(userId);

  return true;
}

async function handleVerificationInteraction(interaction) {
  try {
    if (interaction.isButton()) {
      const modalHandled = await showVerificationModal(interaction);

      if (modalHandled) return;

      await handleVerificationDecision(interaction);
      return;
    }

    if (interaction.isModalSubmit()) {
      await submitVerificationForm(interaction);
    }
  } catch (error) {
    console.error("Verification interaction error:", error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction
        .reply({
          content: "صار خطأ أثناء تنفيذ الطلب.",
          flags: MessageFlags.Ephemeral
        })
        .catch(() => {});
    }
  }
}

module.exports = {
  sendVerificationPanel,
  handleVerificationInteraction
};
