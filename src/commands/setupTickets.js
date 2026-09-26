const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { getGuildConfig } = require('../storage');
const TICKET_TYPES = require('../ticketTypes');

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-tickets')
    .setDescription('Post the ticket panel in this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const guildConfig = getGuildConfig(interaction.guild.id);
    const activeTypes = guildConfig.categories.map((id) => TICKET_TYPES[id]).filter(Boolean);

    if (activeTypes.length === 0) {
      return interaction.reply({
        content: '⚠️ No ticket categories are enabled for this server. Use `/ticket-config` to enable some first.',
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎫 Support Tickets')
      .setDescription('Click a button below to open a ticket.\n\n' + activeTypes.map((t) => `${t.emoji} **${t.label}**`).join('\n'))
      .setColor(0x5865f2);

    const rows = chunk(activeTypes, 5).map((group) =>
      new ActionRowBuilder().addComponents(
        group.map((t) =>
          new ButtonBuilder().setCustomId(`open_ticket_${t.id}`).setLabel(t.label).setEmoji(t.emoji).setStyle(ButtonStyle.Primary)
        )
      )
    );

    await interaction.reply({ embeds: [embed], components: rows });
  },
};
