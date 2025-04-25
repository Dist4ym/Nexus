require('dotenv').config();
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { db, dbPath } = require('./database/connection');

console.log(`[INFO] Base de datos en: ${dbPath}`);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ]
});

client.prefixCommands = new Collection();

const prefixCommandsPath = path.join(__dirname, 'commands');
const prefixCommandFiles = fs.readdirSync(prefixCommandsPath).filter(file => file.endsWith('.js'));

for (const file of prefixCommandFiles) {
  const command = require(`./commands/${file}`);
  client.prefixCommands.set(command.data.name, command);
}

console.log('[INFO] Comandos cargados:', client.prefixCommands.keys());

client.on('interactionCreate', async interaction => {
  if (interaction.isButton()) {
    const blackjackCommand = client.prefixCommands.get('bj');
    if (blackjackCommand?.handleButtons) {
      await blackjackCommand.handleButtons(interaction);
    }
  }
});

client.on('messageCreate', async (message) => {
  if (!message.content.startsWith('!') || message.author.bot) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = client.prefixCommands.get(commandName);

  if (!command) return;

  try {
    if (command.requiresDB) {
      await command.execute(message, db, args);
    } else {
      await command.execute(message, args);
    }
  } catch (error) {
    console.error(`[ERROR] Comando ${commandName}:`, error);
    await message.reply('❌ Error al ejecutar el comando.');
  }
});

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client, db));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client, db));
  }
}

client.login(process.env.BOT_TOKEN)
  .then(() => console.log(`[INFO] Bot conectado como ${client.user.tag}`))
  .catch(err => console.error('[ERROR] Login:', err));

process.on('SIGINT', () => {
  db.close((err) => {
    if (err) console.error('[ERROR] Al cerrar DB:', err);
    process.exit(0);
  });
});