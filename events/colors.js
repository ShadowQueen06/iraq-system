const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    EmbedBuilder
} = require("discord.js");

const COLOR_CHANNEL_ID = "1527062073262215250";

const COLORS = {
    red: "1527115698021859450",
    orange: "1527115818427613348",
    yellow: "1527115917086167070",
    green: "1527116014850936955",
    cyan: "1527116126864277615",
    blue: "1527116248260022332",
    purple: "1527116351473451118",
    pink: "1527116450542915604",
    white: "1527116553735114814",
    black: "1527116666956157078",
    brown: "1527116792928145549",
    gray: "1527116886754459699"
};

module.exports = {
    COLORS,

    async sendPanel(message) {

        if (message.channel.id !== COLOR_CHANNEL_ID) return;
        if (message.content !== "الوان") return;

        const embed = new EmbedBuilder()
            .setColor("#ff7eb6")
            .setTitle("🎨 GI Colors")
            .setDescription(
`اختر لون اسمك من القائمة.

• يمكنك تغيير اللون في أي وقت.
• يمكنك امتلاك لون واحد فقط.`
            );

        const menu = new StringSelectMenuBuilder()
            .setCustomId("color_menu")
            .setPlaceholder("اختر لونك")
            .addOptions([
                { label: "Red", value: "red", emoji: "❤️" },
                { label: "Orange", value: "orange", emoji: "🧡" },
                { label: "Yellow", value: "yellow", emoji: "💛" },
                { label: "Green", value: "green", emoji: "💚" },
                { label: "Cyan", value: "cyan", emoji: "🩵" },
                { label: "Blue", value: "blue", emoji: "💙" },
                { label: "Purple", value: "purple", emoji: "💜" },
                { label: "Pink", value: "pink", emoji: "🩷" },
                { label: "White", value: "white", emoji: "🤍" },
                { label: "Black", value: "black", emoji: "🖤" },
                { label: "Brown", value: "brown", emoji: "🤎" },
                { label: "Gray", value: "gray", emoji: "🩶" }
            ]);

        const row = new ActionRowBuilder().addComponents(menu);

        await message.channel.send({
            embeds: [embed],
            components: [row]
        });
    }
};
