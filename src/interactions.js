const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const { getGuildConfig, getTicket } = require('./storage');
const { createTicketChannel, closeTicketChannel } = require('./ticketManager');
const TICKET_TYPES = require('./ticketTypes');

// Holds a user's General Support answer while they pick an importance level.
// Key: `${userId}_${guildId}` -> { description }
const pendingGeneral = new Map();

function styleFor(s) {
  return s === 'PARAGRAPH' ? TextInputStyle.Paragraph : TextInputStyle.Short;
}

async function handleButton(interaction) {
  const id = interaction.customId;

  if (id.startsWith('open_ticket_')) {
    const typeId = id.replace('open_ticket_', '');
    const typeDef = TICKET_TYPES[typeId];
    if (!typeDef) return interaction.reply({ content: 'Unknown ticket type.', ephemeral: true });

    const modal = new ModalBuilder().setCustomId(`modal_${typeId}`).setTitle(typeDef.modal.title);
    for (const f of typeDef.modal.fields) {
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId(f.customId)
            .setLabel(f.label)
            .setStyle(styleFor(f.style))
            .setRequired(!!f.required)
            .setMaxLength(1000)
        )
      );
    }
    return interaction.showModal(modal);
  }

  if (id === 'close_ticket') {
    const ticket = getTicket(interaction.channel.id);
    const guildConfig = getGuildConfig(interaction.guild.id);
    const isOpener = ticket && ticket.openerId === interaction.user.id;
    const isSupport = guildConfig.supportRoleId && interaction.member.roles.cache.has(guildConfig.supportRoleId);
    const isManager = interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);
    if (!isOpener && !isSupport && !isManager) {
      return interaction.reply({ content: '⚠️ You do not have permission to close this ticket.', ephemeral: true });
    }
    await interaction.deferUpdate();
    return closeTicketChannel(interaction.channel, `<@${interaction.user.id}>`);
  }
}

async function handleModal(interaction) {
  const id = interaction.customId;
  const typeId = id.replace('modal_', '');
  const typeDef = TICKET_TYPES[typeId];
  if (!typeDef) return;

  const answers = {};
  for (const f of typeDef.modal.fields) {
    answers[f.customId] = interaction.fields.getTextInputValue(f.customId);
  }

  // General Support needs an importance level, which modals can't contain
  // (Discord modals only support text inputs) -- so ask via a follow-up dropdown.
  if (typeDef.needsImportance) {
    pendingGeneral.set(`${interaction.user.id}_${interaction.guild.id}`, answers);
    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_importance')
        .setPlaceholder('Select importance')
        .addOptions(
          { label: 'Low', value: 'Low', emoji: '🟢' },
          { label: 'Medium', value: 'Medium', emoji: '🟡' },
          { label: 'High', value: 'High', emoji: '🔴' }
        )
    );
    return interaction.reply({
      content: 'One more step — how important is this request?',
      components: [row],
      ephemeral: true,
    });
  }

  const guildConfig = getGuildConfig(interaction.guild.id);
  await interaction.deferReply({ ephemeral: true });
  const channel = await createTicketChannel({
    guild: interaction.guild,
    member: interaction.member,
    guildConfig,
    typeId,
    answers,
  });
  return interaction.editReply({ content: `✅ Ticket created: ${channel}` });
}

async function handleSelect(interaction) {
  const id = interaction.customId;

  if (id === 'select_importance') {
    const key = `${interaction.user.id}_${interaction.guild.id}`;
    const answers = pendingGeneral.get(key);
    pendingGeneral.delete(key);
    if (!answers) {
      return interaction.update({ content: '⚠️ This request expired, please click the button again.', components: [] });
    }

    const guildConfig = getGuildConfig(interaction.guild.id);
    await interaction.update({ content: 'Creating your ticket...', components: [] });
    const importance = interaction.values[0];
    const channel = await createTicketChannel({
      guild: interaction.guild,
      member: interaction.member,
      guildConfig,
      typeId: 'general',
      answers,
      extraFields: [{ name: 'Importance', value: importance, inline: true }],
    });
    return interaction.editReply({ content: `✅ Ticket created: ${channel}` });
  }

  if (id === 'tier_assign_select') {
    const tier = interaction.values[0];
    const embed = new EmbedBuilder()
      .setTitle('🏆 Tier Assigned')
      .setDescription(`This player has been placed in **${tier} Tier**.`)
      .setColor(0x57f287)
      .setFooter({ text: `Assigned by ${interaction.user.tag}` })
      .setTimestamp();
    await interaction.update({ content: `Tier assigned: **${tier} Tier**. Closing ticket...`, components: [] });
    await interaction.channel.send({ embeds: [embed] });
    return closeTicketChannel(interaction.channel, `<@${interaction.user.id}>`);
  }
}

module.exports = { handleButton, handleModal, handleSelect };
