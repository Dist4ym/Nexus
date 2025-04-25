const { db } = require('../database/connection');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) { 

    console.log(`Bot conectado como ${client.user.tag}`);
    console.log(`Invite URL: https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=8`);
  }
};