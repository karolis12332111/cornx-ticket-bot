require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  AttachmentBuilder
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID;

let ticketCounter = 0;

client.once("ready", async () => {
  console.log(`🔥 ${client.user.tag} online`);

  const guild = client.guilds.cache.first();

  await guild.commands.create({
    name: "panel",
    description: "Open support panel"
  });
});

/* ================= MAIN ================= */

client.on("interactionCreate", async interaction => {

  /* PANEL */

  if (interaction.isChatInputCommand()) {

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("🎫 Advanced Support System")
      .setDescription(`
━━━━━━━━━━━━━━━━━━━━━━

🛒 **Purchase**
Buy products or services.

🛠 **Support**
Need help with something.

🚨 **Report**
Report users or issues.

━━━━━━━━━━━━━━━━━━━━━━
Select a category below.
`)
      .setImage("https://images.unsplash.com/photo-1611605698323-b1e99cfd37ea?auto=format&fit=crop&w=1200&q=60")
      .setFooter({ text: `${interaction.guild.name} • Professional Ticket System` });

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("create_ticket")
        .setPlaceholder("Choose category")
        .addOptions([
          { label: "Purchase", value: "purchase" },
          { label: "Support", value: "support" },
          { label: "Report", value: "report" }
        ])
    );

    return interaction.reply({ embeds: [embed], components: [menu] });
  }

  /* CREATE TICKET */

  if (interaction.isStringSelectMenu()) {

    const existing = interaction.guild.channels.cache.find(
      c => c.topic === interaction.user.id
    );

    if (existing)
      return interaction.reply({ content: "❌ You already have an open ticket.", ephemeral: true });

    ticketCounter++;
    const number = String(ticketCounter).padStart(4, "0");

    const channel = await interaction.guild.channels.create({
      name: `ticket-${number}`,
      type: ChannelType.GuildText,
      parent: TICKET_CATEGORY_ID || null,
      topic: interaction.user.id,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        { id: STAFF_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
      ]
    });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("claim").setLabel("Claim").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("rename").setLabel("Rename").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("add").setLabel("Add Member").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("close").setLabel("Close").setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#3ba55d")
          .setTitle(`🎫 Ticket #${number}`)
          .setDescription(`Hello <@${interaction.user.id}>, describe your issue.`)
      ],
      components: [buttons]
    });

    return interaction.reply({ content: `✅ Ticket created: ${channel}`, ephemeral: true });
  }

  const isStaff = interaction.member?.roles.cache.has(STAFF_ROLE_ID);

  /* CLAIM */

  if (interaction.isButton() && interaction.customId === "claim") {

    if (!isStaff)
      return interaction.reply({ content: "❌ No permission.", ephemeral: true });

    await interaction.reply({ content: `🎯 Claimed by ${interaction.user}` });
  }

  /* RENAME */

  if (interaction.isButton() && interaction.customId === "rename") {

    if (!isStaff)
      return interaction.reply({ content: "❌ No permission.", ephemeral: true });

    const modal = new ModalBuilder()
      .setCustomId("rename_modal")
      .setTitle("Rename Ticket");

    const input = new TextInputBuilder()
      .setCustomId("new_name")
      .setLabel("New Channel Name")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    return interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === "rename_modal") {

    const newName = interaction.fields.getTextInputValue("new_name");
    await interaction.channel.setName(newName);

    return interaction.reply({ content: "✅ Renamed.", ephemeral: true });
  }

  /* ADD MEMBER (CHAT MENTION SYSTEM) */

  if (interaction.isButton() && interaction.customId === "add") {

    if (!isStaff)
      return interaction.reply({ content: "❌ No permission.", ephemeral: true });

    await interaction.reply({ content: "Mention the user in chat now.", ephemeral: true });

    const filter = m => m.author.id === interaction.user.id;
    const collected = await interaction.channel.awaitMessages({
      filter,
      max: 1,
      time: 30000
    });

    const message = collected.first();
    if (!message) return;

    const mentioned = message.mentions.users.first();
    if (!mentioned)
      return interaction.followUp({ content: "❌ No user mentioned.", ephemeral: true });

    await interaction.channel.permissionOverwrites.create(mentioned.id, {
      ViewChannel: true,
      SendMessages: true
    });

    await interaction.followUp({ content: `✅ ${mentioned} added to ticket.` });
  }

  /* CLOSE */

  if (interaction.isButton() && interaction.customId === "close") {

    if (!isStaff)
      return interaction.reply({ content: "❌ No permission.", ephemeral: true });

    await interaction.deferReply({ ephemeral: true });

   const messages = await interaction.channel.messages.fetch({ limit: 100 });


    const transcript = messages.reverse().map(m =>
      `[${m.createdAt.toLocaleString()}] ${m.author.tag}: ${m.content}`
    ).join("\n");

    const file = new AttachmentBuilder(
      Buffer.from(transcript, "utf-8"),
      { name: "transcript.txt" }
    );

    const userId = interaction.channel.topic;
    const user = await client.users.fetch(userId);

    await user.send({ content: "📄 Ticket Transcript:", files: [file] }).catch(() => {});

    if (LOG_CHANNEL_ID) {
      const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
      if (logChannel)
        await logChannel.send({ content: `Ticket closed by ${interaction.user}`, files: [file] });
    }

    await interaction.channel.delete();
  }

});

client.login(process.env.TOKEN);
