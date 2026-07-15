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

const REQUEST_CHANNEL_ID = "1527040526036107455";
const LOG_CHANNEL_ID = "1527040584433274921";

const MISS_ROLE_ID = "1527011950993735681";
const PRINCESS_ROLE_ID = "1527012096892735729";

const pendingRequests = new Set();

function disableButtons(messageComponents) {
  return messageComponents.map(row => {
    const newRow = ActionRowBuilder.from(row);

    newRow.components = row.components.map(component =>
      ButtonBuilder.from(component).setDisabled(true)
    );

    return newRow;
  });
}

async function sendPanel(message) {
  if (message.channel.id !== REQUEST_CHANNEL_ID) return;

  if (
    !message.member.permissions.has(PermissionFlagsBits.Administrator) &&
    message.guild.ownerId !== message.author.id
  ) {
    return;
  }

  const command = message.content.trim().toLowerCase();

  if (command !== "لوحة توثيق" && command !== "verification-panel") {
    return;
  }

  await message.delete().catch(() => {});

  const embed = new EmbedBuilder()
    .setColor("#D4AF37")
    .setTitle("Girls Verification")
    .setDescription(
      [
        "أهلًا بكِ في نظام التوثيق الخاص بسيرفر **Great Iraq**.",
        "",
        "إذا كنتِ ترغبين بالحصول على رتبة **Princess**، اضغطي على زر التقديم الموجود بالأسفل.",
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━",
        "**معلومات مهمة**",
        "",
        "• التوثيق مخصص للبنات فقط.",
        "• تأكدي من إدخال معلوماتك الصحيحة.",
        "• جميع الطلبات تتم مراجعتها من قبل الإدارة.",
        "• قد يتم استدعاؤكِ إلى روم التوثيق الصوتي.",
        "",
        "روم التوثيق:",
        "<#1527040675546271865>",
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━",
        "**النموذج يحتوي على**",
        "",
        "• الاسم",
        "• العمر",
        "• الدولة أو المدينة",
        "• الاهتمامات",
        "",
        "عند قبول الطلب، تحصلين على رتبة **Princess** تلقائيًا."
      ].join("\n")
    )
    .setFooter({ text: "Great Iraq • Girls Verification" });

  const button = new ButtonBuilder()
    .setCustomId("verification_apply")
    .setLabel("تقديم توثيق")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(button);

  await message.channel.send({
    content: "@everyone",
    embeds: [embed],
    components: [row],
    allowedMentions: {
      parse: ["everyone"]
    }
  });
}

async function openModal(interaction) {
  if (interaction.customId !== "verification_apply") return;

  const member = await interaction.guild.members
    .fetch(interaction.user.id)
    .catch(() => null);

  if (!member) {
    return interaction.reply({
      content: "تعذر قراءة حسابكِ داخل السيرفر.",
      flags: MessageFlags.Ephemeral
    });
  }

  if (member.roles.cache.has(PRINCESS_ROLE_ID)) {
    return interaction.reply({
      content: "أنتِ موثقة بالفعل وعندكِ رتبة Princess.",
      flags: MessageFlags.Ephemeral
    });
  }

  if (pendingRequests.has(interaction.user.id)) {
    return interaction.reply({
      content: "عندكِ طلب توثيق قيد المراجعة حاليًا.",
      flags: MessageFlags.Ephemeral
    });
  }

  const modal = new ModalBuilder()
    .setCustomId("verification_form")
    .setTitle("تقديم طلب توثيق");

  const nameInput = new TextInputBuilder()
    .setCustomId("verification_name")
    .setLabel("الاسم")
    .setPlaceholder("اكتبي اسمكِ")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(50);

  const ageInput = new TextInputBuilder()
    .setCustomId("verification_age")
    .setLabel("العمر")
    .setPlaceholder("اكتبي عمركِ")
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
}

async function submitForm(interaction) {
  if (interaction.customId !== "verification_form") return;

  const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

  if (!logChannel) {
    return interaction.reply({
      content: "روم طلبات التوثيق غير موجود.",
      flags: MessageFlags.Ephemeral
    });
  }

  if (pendingRequests.has(interaction.user.id)) {
    return interaction.reply({
      content: "عندكِ طلب توثيق قيد المراجعة.",
      flags: MessageFlags.Ephemeral
    });
  }

  const name = interaction.fields.getTextInputValue("verification_name");
  const age = interaction.fields.getTextInputValue("verification_age");
  const location = interaction.fields.getTextInputValue(
    "verification_location"
  );
  const interests = interaction.fields.getTextInputValue(
    "verification_interests"
  );

  if (!/^\d{1,3}$/.test(age)) {
    return interaction.reply({
      content: "العمر لازم يكون رقمًا صحيحًا.",
      flags: MessageFlags.Ephemeral
    });
  }

  pendingRequests.add(interaction.user.id);

  const embed = new EmbedBuilder()
    .setColor("#F1C40F")
    .setTitle("طلب توثيق جديد")
    .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
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
    .setFooter({ text: "Great Iraq • Verification System" });

  const approveButton = new ButtonBuilder()
    .setCustomId(`verification_approve:${interaction.user.id}`)
    .setLabel("موافقة")
    .setStyle(ButtonStyle.Success);

  const rejectButton = new ButtonBuilder()
    .setCustomId(`verification_reject:${interaction.user.id}`)
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
        "تم إرسال طلبكِ إلى الإدارة. انتظري حتى تتم مراجعته.",
      flags: MessageFlags.Ephemeral
    });
  } catch (error) {
    pendingRequests.delete(interaction.user.id);
    console.error("Verification submit error:", error);

    await interaction.reply({
      content: "صار خطأ أثناء إرسال الطلب.",
      flags: MessageFlags.Ephemeral
    });
  }
}

async function handleDecision(interaction) {
  const isApprove = interaction.customId.startsWith(
    "verification_approve:"
  );

  const isReject = interaction.customId.startsWith(
    "verification_reject:"
  );

  if (!isApprove && !isReject) return;

  if (
    !interaction.member.permissions.has(
      PermissionFlagsBits.ManageRoles
    )
  ) {
    return interaction.reply({
      content: "ما عندكِ صلاحية مراجعة طلبات التوثيق.",
      flags: MessageFlags.Ephemeral
    });
  }

  const userId = interaction.customId.split(":")[1];

  const member = await interaction.guild.members
    .fetch(userId)
    .catch(() => null);

  if (!member) {
    pendingRequests.delete(userId);

    return interaction.reply({
      content: "العضوة غير موجودة داخل السيرفر.",
      flags: MessageFlags.Ephemeral
    });
  }

  await interaction.deferUpdate();

  const oldEmbed = interaction.message.embeds[0];

  if (!oldEmbed) return;

  const disabledRows = disableButtons(interaction.message.components);

  if (isApprove) {
    try {
      await member.roles.add(
        PRINCESS_ROLE_ID,
        `تم قبول التوثيق بواسطة ${interaction.user.tag}`
      );

      if (member.roles.cache.has(MISS_ROLE_ID)) {
        await member.roles.remove(
          MISS_ROLE_ID,
          `تم قبول التوثيق بواسطة ${interaction.user.tag}`
        );
      }

      const approvedEmbed = EmbedBuilder.from(oldEmbed)
        .setColor("#57F287")
        .spliceFields(-1, 1, {
          name: "الحالة",
          value: `تمت الموافقة بواسطة ${interaction.user}`
        });

      await interaction.message.edit({
        embeds: [approvedEmbed],
        components: disabledRows
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
      console.error("Verification approve error:", error);

      await interaction
        .followUp({
          content:
            "ما كدرت أغيّر الرتب. تأكد أن رتبة البوت أعلى من Miss وPrincess.",
          flags: MessageFlags.Ephemeral
        })
        .catch(() => {});
    }

    return;
  }

  const rejectedEmbed = EmbedBuilder.from(oldEmbed)
    .setColor("#ED4245")
    .spliceFields(-1, 1, {
      name: "الحالة",
      value: `تم رفض الطلب بواسطة ${interaction.user}`
    });

  await interaction.message.edit({
    embeds: [rejectedEmbed],
    components: disabledRows
  });

  await member
    .send(
      [
        "نعتذر، تم رفض طلب التوثيق الخاص بكِ.",
        "",
        "إذا تعتقدين صار خطأ، افتحي تذكرة وتواصلي مع الإدارة."
      ].join("\n")
    )
    .catch(() => {});

  pendingRequests.delete(userId);
}

async function handleInteraction(interaction) {
  try {
    if (interaction.isButton()) {
      await openModal(interaction);
      await handleDecision(interaction);
      return;
    }

    if (interaction.isModalSubmit()) {
      await submitForm(interaction);
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
  sendPanel,
  handleInteraction
};
