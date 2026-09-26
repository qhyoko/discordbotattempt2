# Discord Ticket Bot

Channel-based (not forum-based) ticket bot with per-server customization.

## What it does

- **General Support** — button → modal ("What do you need help with?") → dropdown for
  importance (Low/Medium/High) → creates a private ticket channel.
- **Bug Report** — modal with Bug Description, Steps to Reproduce, Expected Behavior
  (these weren't specified in the request, so this is a sensible default — edit freely,
  see "Customizing" below).
- **Player Report** — modal with: Who are you reporting? / Why are you reporting them? /
  What evidence do you have?
- **Tierlist Ticket** — modal with Previous Tier and IGN, shown in the ticket's embed.
  Staff close it with `/tier`, which shows a dropdown (S / A / B / C / D Tier), posts the
  result, and deletes the channel.
- Every ticket also gets a **Close Ticket** button, usable by the ticket opener, the
  configured support role, or anyone with Manage Channels.
- **Multi-server**: each server has its own independent configuration (which categories
  are active, which category channel tickets are filed under, which role is support
  staff). Nothing is hardcoded to a specific server ID — configure each server with
  `/ticket-config`.

## Setup

1. Create an application + bot at https://discord.com/developers/applications.
   - Under **Bot**, disable "Public Bot" if you don't want others adding it, and copy
     the token.
   - Under **OAuth2 → URL Generator**, check scopes `bot` and `applications.commands`,
     and permissions: `Manage Channels`, `View Channels`, `Send Messages`,
     `Manage Roles`, `Embed Links`. Use the generated URL to invite the bot.
   - Give the bot's role a position **above** your support role in Server Settings →
     Roles, so its channel permission overwrites work correctly.

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and fill in `DISCORD_TOKEN` and `CLIENT_ID`. Optionally
   set `GUILD_ID` while developing so slash commands register instantly (global
   registration can take up to an hour to propagate).

4. Register the slash commands:
   ```bash
   npm run deploy
   ```

5. Start the bot:
   ```bash
   npm start
   ```

## Configuring each server

Run these once per server (requires Manage Server permission):

```
/ticket-config preset preset:standard      # General Support, Bug Report, Player Report (default)
/ticket-config preset preset:tierlist      # General Support, Player Report, Tierlist Ticket

/ticket-config category type:<x> action:<enable|disable>   # fine-grained toggle
/ticket-config ticketcategory category:<#Discord category>  # where ticket channels are created
/ticket-config supportrole role:<@role>                      # staff role that can view/close tickets & use /tier
/ticket-config show                                          # view current settings
```

Then post the panel in whatever channel you want it in:

```
/setup-tickets
```

This posts an embed with one button per enabled category. Clicking a button opens the
relevant form.

## Customizing

Everything about a ticket category — its label, emoji, color, channel name prefix, and
form questions — lives in `src/ticketTypes.js`. To add a brand-new category:

1. Add an entry to `src/ticketTypes.js` following the existing pattern.
2. Restart the bot.
3. Enable it per-server with `/ticket-config category type:<your_id> action:enable`.

Only General Support currently has the extra importance dropdown (`needsImportance:
true`); add that flag to any other type and handle it in `src/interactions.js` if you
want the same behavior elsewhere.

## Data storage

Configuration and active-ticket tracking are stored as JSON in `data/guilds.json` and
`data/tickets.json` (created automatically on first run). This is plenty for small/medium
communities; swap `src/storage.js` for a real database if you need it at larger scale.
