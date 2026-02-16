require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;
const CATEGORY_ID = process.env.TICKET_CATEGORY_ID;

client.once("ready", () => {
  console.log(`🔥 ${client.user.tag} online`);
});

client.on("messageCreate", async (message) => {
  if (message.content === "!panel") {

    const embed = new EmbedBuilder()
      .setColor("#2b2d31")
      .setTitle("🛒 Purchase Setup")
      .setDescription(
`Select your payment option below then press Create Ticket.

**Supported Payments:**
PayPal, Credit/Debit

**Gift Card Payments:**
Amazon, Paysafecard, CryptoVoucher`
      )
      .setImage("https://i.imgur.com/8Km9tLL.png"); // gali pakeist į savo image

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("purchase")
        .setLabel("Purchase")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("support")
        .setLabel("Support")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("other")
        .setLabel("Other")
        .setStyle(ButtonStyle.Secondary)
    );

    message.channel.send({ embeds: [embed], components: [row] });
  }
});

client.on("interactionCreate", async (interaction) => {

  // CREATE TICKET
  if (interaction.isButton() && ["purchase","support","other"].includes(interaction.customId)) {

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: CATEGORY_ID,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        },
        {
          id: STAFF_ROLE_ID,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        }
      ]
    });

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("🎫 Ticket Created")
      .setDescription(`Hello ${interaction.user}, please describe your issue.`);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("rename")
        .setLabel("Rename")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("add")
        .setLabel("Add Member")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("close")
        .setLabel("Close")
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({ embeds: [embed], components: [row] });

    interaction.reply({ content: `Ticket created: ${channel}`, ephemeral: true });
  }

  // RENAME
  if (interaction.isButton() && interaction.customId === "rename") {
    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) return;

    const modal = new ModalBuilder()
      .setCustomId("rename_modal")
      .setTitle("Rename Ticket");

    const input = new TextInputBuilder()
      .setCustomId("new_name")
      .setLabel("New Channel Name")
      .setStyle(TextInputStyle.Short);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === "rename_modal") {
    const newName = interaction.fields.getTextInputValue("new_name");
    await interaction.channel.setName(newName);
    interaction.reply({ content: "Renamed!", ephemeral: true });
  }

  // ADD MEMBER
  if (interaction.isButton() && interaction.customId === "add") {
    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) return;

    await interaction.reply({
      content: "Ping the user you want to add.",
      ephemeral: true
    });
  }

  // CLOSE
  if (interaction.isButton() && interaction.customId === "close") {
    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) return;

    await interaction.reply("Closing ticket...");
    setTimeout(() => interaction.channel.delete(), 3000);
  }
});

client.login(process.env.TOKEN);
