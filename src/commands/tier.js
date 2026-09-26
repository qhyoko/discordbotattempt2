const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, getTicket } = require('../storage');

module.exports = {
  data: new SlashCommandBuilder().setName('tier').setDescription('Assign a tier and close this Tierlist ticket'),

  async execute(interaction) {
    const ticket = getTicket(interaction.channel.id);
    if (!ticket || ticket.typeId !== 'tier') {
      return interaction.reply({ content: '⚠️ This command can only be used inside a Tierlist Ticket channel.', ephemeral: true });
    }

    const guildConfig = getGuildConfig(interaction.guild.id);
    const isSupport = guildConfig.supportRoleId && interaction.member.roles.cache.has(guildConfig.supportRoleId);
    const isManager = interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);
    if (!isSupport && !isManager) {
      return interaction.reply({ content: '⚠️ Only staff can assign a tier.', ephemeral: true });
    }

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('tier_assign_select')
        .setPlaceholder('Select a tier')
        .addOptions(
          { label: 'S Tier', value: 'S' },
          { label: 'A Tier', value: 'A' },
          { label: 'B Tier', value: 'B' },
          { label: 'C Tier', value: 'C' },
          { label: 'D Tier', value: 'D' }
        )
    );

    await interaction.reply({ content: 'Select the tier to assign to this player:', components: [row], ephemeral: true });
  },
};
