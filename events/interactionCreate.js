const { MessageFlags } = require("discord.js");
const { COLORS } = require("./colors");

module.exports = async interaction => {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId !== "color_menu") return;

  const selectedColor = interaction.values[0];
  const selectedRoleId = COLORS[selectedColor];

  if (!selectedRoleId) {
    return interaction.reply({
      content: "صار خطأ باختيار اللون.",
      flags: MessageFlags.Ephemeral
    });
  }

  const member = await interaction.guild.members
    .fetch(interaction.user.id)
    .catch(() => null);

  if (!member) {
    return interaction.reply({
      content: "ما كدرت ألقى حسابك داخل السيرفر.",
      flags: MessageFlags.Ephemeral
    });
  }

  const colorRoleIds = Object.values(COLORS);

  const oldColorRoles = member.roles.cache.filter(role =>
    colorRoleIds.includes(role.id)
  );

  try {
    if (oldColorRoles.size > 0) {
      await member.roles.remove(
        oldColorRoles,
        `Color changed by ${interaction.user.tag}`
      );
    }

    await member.roles.add(
      selectedRoleId,
      `Color selected by ${interaction.user.tag}`
    );

    await interaction.reply({
      content: "تم تغيير لون اسمك بنجاح.",
      flags: MessageFlags.Ephemeral
    });
  } catch (error) {
    console.error("Color role error:", error);

    await interaction.reply({
      content:
        "ما كدرت أغير اللون. تأكد أن رتبة البوت أعلى من رتب الألوان وعنده صلاحية Manage Roles.",
      flags: MessageFlags.Ephemeral
    });
  }
};
