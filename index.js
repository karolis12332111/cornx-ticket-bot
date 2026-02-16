const {
    Client,
    GatewayIntentBits,
    ChannelType,
    PermissionsBitField,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
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
   PANEL KOMANDA
========================= */

client.on('messageCreate', async (message) => {

    if (message.content === '!panel') {

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('🛒 Purchase Setup')
            .setDescription(
`Select your payment method below, then press Create Ticket.

━━━━━━━━━━━━━━━━━━

💳 **Supported Payments:**
• PayPal

🎁 **Gift Card Payments:**
• Paysafecard  
• Amazon  
• CryptoVoucher

━━━━━━━━━━━━━━━━━━`
            )
            .setImage('https://i.imgur.com/4M34hi2.png')
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
   BUTTON HANDLER
========================= */

client.on('interactionCreate', async interaction => {

    if (interaction.isButton()) {

        /* ========= CREATE TICKET ========= */

        if (['purchase', 'support', 'other'].includes(interaction.customId)) {

            const ticket = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    }
                ]
            });

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`🎫 Ticket Created`)
                .setDescription(`Hello ${interaction.user}, describe your issue.`);

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('rename')
                        .setLabel('Rename')
                        .setStyle(ButtonStyle.Primary),

                    new ButtonBuilder()
                        .setCustomId('add')
                        .setLabel('Add Member')
                        .setStyle(ButtonStyle.Secondary),

                    new ButtonBuilder()
                        .setCustomId('close')
                        .setLabel('Close')
                        .setStyle(ButtonStyle.Danger)
                );

            await ticket.send({
                embeds: [embed],
                components: [buttons]
            });

            await interaction.reply({
                content: `✅ Ticket created: ${ticket}`,
                ephemeral: true
            });
        }

        /* ========= RENAME ========= */

        if (interaction.customId === 'rename') {

            const modal = new ModalBuilder()
                .setCustomId('renameModal')
                .setTitle('Rename Ticket');

            const input = new TextInputBuilder()
                .setCustomId('newName')
                .setLabel('New ticket name')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(input);
            modal.addComponents(row);

            await interaction.showModal(modal);
        }

        /* ========= ADD MEMBER ========= */

        if (interaction.customId === 'add') {
            await interaction.reply({
                content: 'Mention the user you want to add.',
                ephemeral: true
            });
        }

        /* ========= CLOSE ========= */

        if (interaction.customId === 'close') {

            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            let transcript = '';

            messages.reverse().forEach(msg => {
                transcript += `${msg.author.tag}: ${msg.content}\n`;
            });

            try {
                await interaction.user.send({
                    content: `📄 Transcript:\n\n${transcript.substring(0, 1900)}`
                });
            } catch {}

            await interaction.channel.delete();
        }
    }

    /* ========= MODAL SUBMIT ========= */

    if (interaction.isModalSubmit()) {

        if (interaction.customId === 'renameModal') {

            const newName = interaction.fields.getTextInputValue('newName');
            await interaction.channel.setName(newName);

            await interaction.reply({
                content: '✅ Ticket renamed!',
                ephemeral: true
            });
        }
    }
});

/* ========= ADD MEMBER LOGIC ========= */

client.on('messageCreate', async message => {
    if (!message.mentions.users.size) return;
    if (!message.channel.name.startsWith('ticket-')) return;

    const user = message.mentions.users.first();

    await message.channel.permissionOverwrites.edit(user.id, {
        ViewChannel: true
    });

    await message.reply(`✅ ${user} added to ticket.`);
});

client.login(process.env.TOKEN);
