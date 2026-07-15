const sharp = require("sharp");
const { AttachmentBuilder } = require("discord.js");

module.exports = async message => {
  if (!message.guild) return;
  if (message.author.bot) return;
  if (message.content.trim() !== "خط") return;

  try {
    await message.delete().catch(() => {});

    const width = 1600;
    const height = 180;

    const svg = `
      <svg
        width="${width}"
        height="${height}"
        viewBox="0 0 ${width} ${height}"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#7a4b00"/>
            <stop offset="20%" stop-color="#c99720"/>
            <stop offset="45%" stop-color="#fff0a0"/>
            <stop offset="65%" stop-color="#d4af37"/>
            <stop offset="100%" stop-color="#7a4b00"/>
          </linearGradient>

          <filter id="glow" x="-30%" y="-100%" width="160%" height="300%">
            <feGaussianBlur stdDeviation="6" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="softGlow" x="-30%" y="-100%" width="160%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0)"
        />

        <text
          x="30"
          y="126"
          font-family="Georgia, Times New Roman, serif"
          font-size="105"
          font-weight="bold"
          font-style="italic"
          fill="url(#gold)"
          stroke="#8a5c00"
          stroke-width="2"
          filter="url(#glow)"
        >GI</text>

        <path
          d="
            M 185 105
            C 330 25, 470 150, 650 90
            C 820 35, 960 125, 1120 82
            C 1270 42, 1400 95, 1545 76
          "
          fill="none"
          stroke="url(#gold)"
          stroke-width="9"
          stroke-linecap="round"
          filter="url(#glow)"
        />

        <path
          d="
            M 188 119
            C 350 62, 490 140, 670 108
            C 850 75, 1000 125, 1160 100
            C 1320 75, 1430 112, 1545 95
          "
          fill="none"
          stroke="#d4af37"
          stroke-width="3"
          stroke-linecap="round"
          opacity="0.85"
          filter="url(#softGlow)"
        />

        <path
          d="
            M 188 90
            C 360 55, 520 105, 700 76
            C 900 45, 1070 98, 1240 67
            C 1390 40, 1480 73, 1550 60
          "
          fill="none"
          stroke="#f8dc82"
          stroke-width="2"
          stroke-linecap="round"
          opacity="0.65"
        />

        <circle
          cx="1545"
          cy="76"
          r="9"
          fill="#fff3b0"
          filter="url(#glow)"
        />

        <circle cx="1480" cy="62" r="3" fill="#f7d86a"/>
        <circle cx="1510" cy="103" r="2.5" fill="#f7d86a"/>
        <circle cx="1420" cy="78" r="2" fill="#fff3b0"/>
        <circle cx="1380" cy="102" r="2" fill="#d4af37"/>
        <circle cx="1325" cy="61" r="2.5" fill="#f7d86a"/>
      </svg>
    `;

    const imageBuffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();

    const attachment = new AttachmentBuilder(imageBuffer, {
      name: "gi-gold-line.png"
    });

    await message.channel.send({
      files: [attachment]
    });
  } catch (error) {
    console.error("Decorative line error:", error);

    await message.channel
      .send("صار خطأ أثناء إنشاء الخط.")
      .catch(() => {});
  }
};
