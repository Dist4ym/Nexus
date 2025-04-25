const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { limpiarDatosCompletos } = require('../database/queries');
const { db, dbPath } = require('../database/connection');

module.exports = {
  data: {
    name: 'limpiar-datos',
    description: 'Borra todos los datos (empleados, facturas y servicios)'
  },
  async execute(message) {
    if (!message.member.permissions.has('ADMINISTRATOR')) {
      return message.reply('❌ Solo los administradores pueden usar este comando.');
    }

    if (!db || !dbPath) {
        console.error('Error: db o dbPath no están definidos');
        return message.reply('❌ Error de configuración de la base de datos');
      }
  
      const confirmMessage = await message.reply({
        content: '⚠️ **¿Estás seguro que quieres borrar TODOS los datos?** Esta acción no se puede deshacer.\n\n✅ - Confirmar\n❌ - Cancelar',
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('confirmar_limpiar')
              .setLabel('Confirmar')
              .setStyle(ButtonStyle.Success)
              .setEmoji('✅'),
            new ButtonBuilder()
              .setCustomId('cancelar_limpiar')
              .setLabel('Cancelar')
              .setStyle(ButtonStyle.Danger)
              .setEmoji('❌')
            )
        ]
      });
  
      const filter = i => i.user.id === message.author.id;
      const collector = confirmMessage.createMessageComponentCollector({ filter, time: 60000 });
  
      collector.on('collect', async i => {
        if (i.customId === 'confirmar_limpiar') {
          try {
            await limpiarDatosCompletos(db); 
            await i.update({ 
              content: '✅ **Base de datos limpiada correctamente.** Todas las tablas han sido vaciadas.',
              components: [] 
            });
          } catch (error) {
            console.error('Error al limpiar datos:', error);
            await i.update({ 
              content: '❌ **Error al limpiar la base de datos:** ' + error.message,
              components: [] 
            });
          }
        } else {
            await i.update({ 
              content: '❌ **Operación cancelada.** Los datos no han sido modificados.',
              components: [] 
            });
          }
          collector.stop();
        });
    
        collector.on('end', collected => {
          if (collected.size === 0) {
            confirmMessage.edit({ 
              content: '🕒 **Tiempo agotado.** La operación fue cancelada automáticamente.',
              components: [] 
            });
          }
        });
      }
    };