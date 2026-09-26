const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { setTicket, deleteTicket } = require('./storage');
const TICKET_TYPES = require('./ticketTypes');

function sanitize(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 20) || 'user';
}

async function createTicketChannel({ guild, member, guildConfig, typeId, answers, extraFields = [] }) {
  const typeDef = TICKET_TYPES[typeId];
  const channelName = `${typeDef.channelPrefix}-${sanitize(member.user.username)}`;

  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: member.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
    {
      id: guild.members.me.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
  ];
  if (guildConfig.supportRoleId) {
    overwrites.push({
      id: guildConfig.supportRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    });
  }

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: guildConfig.ticketCategoryId || undefined,
    permissionOverwrites: overwrites,
    topic: `${typeDef.label} ticket opened by ${member.user.tag} (${member.id})`,
  });

  const embed = new EmbedBuilder()
    .setTitle(`${typeDef.emoji} ${typeDef.label}`)
    .setColor(typeDef.color)
    .setThumbnail(member.user.displayAvatarURL())
    .setTimestamp()
    .setFooter({ text: `Opened by ${member.user.tag}` });

  for (const f of typeDef.modal.fields) {
    const value = answers[f.customId];
    if (value) embed.addFields({ name: f.label, value: value.slice(0, 1024) });
  }
  for (const extra of extraFields) {
    embed.addFields(extra);
  }

  const closeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔒')
  );

  const mentionText = guildConfig.supportRoleId ? `<@&${guildConfig.supportRoleId}> ` : '';
  await channel.send({
    content: `${mentionText}<@${member.id}>`,
    embeds: [embed],
    components: [closeRow],
  });

  setTicket(channel.id, { guildId: guild.id, typeId, openerId: member.id, createdAt: Date.now() });

  return channel;
}

async function closeTicketChannel(channel, closerMention) {
  const embed = new EmbedBuilder()
    .setDescription(`🔒 This ticket is being closed by ${closerMention}. Deleting this channel in 5 seconds...`)
    .setColor(0xed4245);
  await channel.send({ embeds: [embed] });
  deleteTicket(channel.id);
  setTimeout(() => channel.delete().catch(() => {}), 5000);
}

module.exports = { createTicketChannel, closeTicketChannel };
