const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const { getGuildConfig, setGuildConfig } = require('../storage');
const TICKET_TYPES = require('../ticketTypes');

// Presets matching the two setups requested: most servers get "standard",
// the tierlist server uses "tierlist". Apply with /ticket-config preset.
const PRESETS = {
  standard: ['general', 'bug', 'player'],
  tierlist: ['general', 'player', 'tier'],
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-config')
    .setDescription('Configure the ticket system for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sc) =>
      sc
        .setName('preset')
        .setDescription('Apply a preset set of ticket categories')
        .addStringOption((o) =>
          o
            .setName('preset')
            .setDescription('Preset name')
            .setRequired(true)
            .addChoices(
              { name: 'Standard (General, Bug, Player)', value: 'standard' },
              { name: 'Tierlist (General, Player, Tier)', value: 'tierlist' }
            )
        )
    )
    .addSubcommand((sc) =>
      sc
        .setName('category')
        .setDescription('Enable or disable a single ticket category')
        .addStringOption((o) =>
          o
            .setName('type')
            .setDescription('Category')
            .setRequired(true)
            .addChoices(...Object.values(TICKET_TYPES).map((t) => ({ name: t.label, value: t.id })))
        )
        .addStringOption((o) =>
          o
            .setName('action')
            .setDescription('enable or disable')
            .setRequired(true)
            .addChoices({ name: 'Enable', value: 'enable' }, { name: 'Disable', value: 'disable' })
        )
    )
    .addSubcommand((sc) =>
      sc
        .setName('ticketcategory')
        .setDescription('Set the Discord category channel tickets are created under')
        .addChannelOption((o) =>
          o.setName('category').setDescription('Category channel').setRequired(true).addChannelTypes(ChannelType.GuildCategory)
        )
    )
    .addSubcommand((sc) =>
      sc
        .setName('supportrole')
        .setDescription('Set the support/staff role that can view & manage tickets')
        .addRoleOption((o) => o.setName('role').setDescription('Support role').setRequired(true))
    )
    .addSubcommand((sc) => sc.setName('show').setDescription('Show current ticket configuration')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'preset') {
      const preset = interaction.options.getString('preset');
      setGuildConfig(guildId, { categories: PRESETS[preset] });
      return interaction.reply({
        content: `✅ Applied the **${preset}** preset: ${PRESETS[preset].map((t) => TICKET_TYPES[t].label).join(', ')}.`,
        ephemeral: true,
      });
    }

    if (sub === 'category') {
      const type = interaction.options.getString('type');
      const action = interaction.options.getString('action');
      const config = getGuildConfig(guildId);
      const categories = new Set(config.categories);
      if (action === 'enable') categories.add(type);
      else categories.delete(type);
      setGuildConfig(guildId, { categories: [...categories] });
      return interaction.reply({ content: `✅ ${TICKET_TYPES[type].label} is now **${action}d**.`, ephemeral: true });
    }

    if (sub === 'ticketcategory') {
      const category = interaction.options.getChannel('category');
      setGuildConfig(guildId, { ticketCategoryId: category.id });
      return interaction.reply({ content: `✅ Tickets will now be created under **${category.name}**.`, ephemeral: true });
    }

    if (sub === 'supportrole') {
      const role = interaction.options.getRole('role');
      setGuildConfig(guildId, { supportRoleId: role.id });
      return interaction.reply({ content: `✅ Support role set to ${role}.`, ephemeral: true });
    }

    if (sub === 'show') {
      const config = getGuildConfig(guildId);
      const embed = new EmbedBuilder()
        .setTitle('Ticket Configuration')
        .setColor(0x5865f2)
        .addFields(
          { name: 'Categories', value: config.categories.map((c) => TICKET_TYPES[c]?.label || c).join(', ') || 'None' },
          { name: 'Ticket Channel Category', value: config.ticketCategoryId ? `<#${config.ticketCategoryId}>` : 'Not set' },
          { name: 'Support Role', value: config.supportRoleId ? `<@&${config.supportRoleId}>` : 'Not set' }
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
