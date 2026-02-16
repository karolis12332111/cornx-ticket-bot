const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');

require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`🔥 ${client.user.tag} online`);
});

/* =========================
   !panel komanda
========================= */

client.on('messageCreate', async (message) => {

    if (message.content === '!panel') {

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('🛒 Purchase Setup')
            .setDescription(
`Select your payment method below, then press **Create Ticket**.

━━━━━━━━━━━━━━━━━━

💳 **Supported Payments:**
• PayPal

🎁 **Gift Card Payments:**
• Paysafecard  
• Amazon  
• CryptoVoucher

━━━━━━━━━━━━━━━━━━`
            )
            .setImage('https://i.imgur.com/yourimage.png') // čia gali įdėti savo image link
            .setFooter({ text: 'Professional Ticket System' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('purchase')
                    .setLabel('Purchase')
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId('support')
                    .setLabel('Support')
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId('other')
                    .setLabel('Other')
                    .setStyle(ButtonStyle.Secondary)
            );

        await message.channel.send({
            embeds: [embed],
            components: [row]
        });
    }
});

/* =========================
   Mygtukų paspaudimai
========================= */

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'purchase') {
        await interaction.reply({ content: '💳 Purchase ticket created!', ephemeral: true });
    }

    if (interaction.customId === 'support') {
        await interaction.reply({ content: '🛠 Support ticket created!', ephemeral: true });
    }

    if (interaction.customId === 'other') {
        await interaction.reply({ content: '❓ Other ticket created!', ephemeral: true });
    }
});

client.login(process.env.TOKEN);
