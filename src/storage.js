const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const GUILDS_FILE = path.join(DATA_DIR, 'guilds.json');
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(GUILDS_FILE)) fs.writeFileSync(GUILDS_FILE, '{}');
  if (!fs.existsSync(TICKETS_FILE)) fs.writeFileSync(TICKETS_FILE, '{}');
}
ensureDataFiles();

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Default preset applied to any server that hasn't been configured yet:
// General Support, Bug Report, Player Report.
const DEFAULT_CATEGORIES = ['general', 'bug', 'player'];

function getGuildConfig(guildId) {
  const guilds = readJSON(GUILDS_FILE);
  if (!guilds[guildId]) {
    guilds[guildId] = {
      categories: [...DEFAULT_CATEGORIES],
      ticketCategoryId: null, // Discord "category" channel tickets get created under
      supportRoleId: null,    // role that can view/close tickets & use /tier
    };
    writeJSON(GUILDS_FILE, guilds);
  }
  return guilds[guildId];
}

function setGuildConfig(guildId, updates) {
  const guilds = readJSON(GUILDS_FILE);
  const current = guilds[guildId] || getGuildConfig(guildId);
  guilds[guildId] = { ...current, ...updates };
  writeJSON(GUILDS_FILE, guilds);
  return guilds[guildId];
}

function getTicket(channelId) {
  const tickets = readJSON(TICKETS_FILE);
  return tickets[channelId] || null;
}
function setTicket(channelId, data) {
  const tickets = readJSON(TICKETS_FILE);
  tickets[channelId] = data;
  writeJSON(TICKETS_FILE, tickets);
}
function deleteTicket(channelId) {
  const tickets = readJSON(TICKETS_FILE);
  delete tickets[channelId];
  writeJSON(TICKETS_FILE, tickets);
}

module.exports = {
  getGuildConfig,
  setGuildConfig,
  getTicket,
  setTicket,
  deleteTicket,
  DEFAULT_CATEGORIES,
};
