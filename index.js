require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const CATEGORY_ID = "PAKEISK_I_CATEGORY_ID"; // <-- Įrašyk savo category ID

client.once("ready", () => {
  console.log(`🔥 ${client.user.tag} online`);
});

client.on("messageCreate", async message => {
  if (message.content === "!panel") {

    const embed = new EmbedBuilder()
      .setColor("#2b2d31")
      .setTitle("🛒 Purchase Setup")
      .setDescription(`Select your payment, region, and budget below, then press Create Ticket.

**Supported Payments:**
Crypto (BTC, ETH, LTC, USDT, SOL), PayPal (F&F), Credit/Debit, Apple Pay, Google Pay, Skrill, Cash Card

**Gift Card Payments:**
Paysafecard (DE), Amazon (DE), Cryptovoucher`)
      .setImage("https://i.imgur.com/1XKQ9wS.png");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("purchase")
        .setLabel("Purchase")
        .setStyle(ButtonStyle.Success)
        .setEmoji("🛒"),

      new ButtonBuilder()
        .setCustomId("support")
        .setLabel("Support")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🎮"),

      new ButtonBuilder()
        .setCustomId("other")
        .setLabel("Other")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("❓")
    );

    message.channel.send({ embeds: [embed], components: [row] });
  }
});

client.on("interactionCreate", async interaction => {

  // CREATE TICKET
  if (interaction.isButton()) {

    if (["purchase", "support", "other"].includes(interaction.customId)) {

      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: CATEGORY_ID,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
          }
        ]
      });

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("🎫 Ticket Created")
        .setDescription("Staff will assist you shortly.");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("close")
          .setLabel("Close")
          .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
          .setCustomId("add")
          .setLabel("Add Member")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("rename")
          .setLabel("Rename")
          .setStyle(ButtonStyle.Secondary)
      );

      channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });

      interaction.reply({ content: `Ticket created: ${channel}`, ephemeral: true });
    }

    // CLOSE
    if (interaction.customId === "close") {

      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      let transcript = messages
        .reverse()
        .map(m => `${m.author.tag}: ${m.content}`)
        .join("\n");

      try {
        await interaction.user.send(`📄 Ticket Transcript:\n\n${transcript}`);
      } catch (err) {}

      await interaction.channel.delete();
    }

    // ADD MEMBER
    if (interaction.customId === "add") {
      interaction.reply({ content: "Mention the user you want to add.", ephemeral: true });
    }

    // RENAME MODAL
    if (interaction.customId === "rename") {

      const modal = new ModalBuilder()
        .setCustomId("renameModal")
        .setTitle("Rename Ticket");

      const input = new TextInputBuilder()
        .setCustomId("newName")
        .setLabel("New Channel Name")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const row = new ActionRowBuilder().addComponents(input);
      modal.addComponents(row);

      await interaction.showModal(modal);
    }
  }

  // HANDLE RENAME
  if (interaction.isModalSubmit()) {
    if (interaction.customId === "renameModal") {

      const newName = interaction.fields.getTextInputValue("newName");

      await interaction.channel.setName(newName);
      interaction.reply({ content: "Channel renamed!", ephemeral: true });
    }
  }
});

// ADD MEMBER VIA MENTION
client.on("messageCreate", async message => {
  if (message.mentions.members.size > 0 && message.channel.name.startsWith("ticket-")) {

    const member = message.mentions.members.first();

    await message.channel.permissionOverwrites.edit(member.id, {
      ViewChannel: true,
      SendMessages: true
    });

    message.reply(`${member} added to ticket.`);
  }
});

client.login(process.env.DISCORD_TOKEN);
