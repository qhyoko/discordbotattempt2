// Every ticket category the bot knows about. To add a new category:
//   1. Add an entry here.
//   2. Enable it per-server with /ticket-config category type:<id> action:enable
//
// modal.fields[].style is 'SHORT' (single line) or 'PARAGRAPH' (multi-line).
// needsImportance triggers the Low/Medium/High dropdown after the modal (General Support only).

module.exports = {
  general: {
    id: 'general',
    label: 'General Support',
    emoji: '🎫',
    color: 0x5865f2,
    channelPrefix: 'general',
    needsImportance: true,
    modal: {
      title: 'General Support Request',
      fields: [
        { customId: 'description', label: 'What do you need help with?', style: 'PARAGRAPH', required: true },
      ],
    },
  },

  bug: {
    id: 'bug',
    label: 'Bug Report',
    emoji: '🐞',
    color: 0xed4245,
    channelPrefix: 'bug',
    modal: {
      title: 'Bug Report',
      fields: [
        { customId: 'description', label: 'Describe the bug', style: 'PARAGRAPH', required: true },
        { customId: 'steps', label: 'Steps to reproduce', style: 'PARAGRAPH', required: true },
        { customId: 'expected', label: 'Expected behavior', style: 'SHORT', required: false },
      ],
    },
  },

  player: {
    id: 'player',
    label: 'Player Report',
    emoji: '🚩',
    color: 0xfee75c,
    channelPrefix: 'report',
    modal: {
      title: 'Player Report',
      fields: [
        { customId: 'who', label: 'Who are you reporting?', style: 'SHORT', required: true },
        { customId: 'why', label: 'Why are you reporting them?', style: 'PARAGRAPH', required: true },
        { customId: 'evidence', label: 'What evidence do you have?', style: 'PARAGRAPH', required: false },
      ],
    },
  },

  tier: {
    id: 'tier',
    label: 'Tierlist Ticket',
    emoji: '🏆',
    color: 0x57f287,
    channelPrefix: 'tier',
    modal: {
      title: 'Tierlist Ticket',
      fields: [
        { customId: 'previousTier', label: 'Previous Tier', style: 'SHORT', required: true },
        { customId: 'ign', label: 'In-Game Name (IGN)', style: 'SHORT', required: true },
      ],
    },
  },
};
