const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('path');
const fs = require('fs');
const { limpiarRegistros } = require('../database/queries');
const { db, dbPath } = require('../database/connection'); 

module.exports = {
  data: {
    name: 'limpiar-registros',
    description: 'Borra registros de facturas y servicios (mantiene empleados)'
  },
  async execute(message) {
    if (!message.member.permissions.has('ADMINISTRATOR')) {
      return message.reply('❌ Solo administradores pueden usar este comando.');
    }

    if (!db || !dbPath) {
        console.error('Error: db o dbPath no están definidos');
        return message.reply('❌ Error de configuración de la base de datos');
      }
  
      const backupDir = path.join(__dirname, '../../backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
  
      const backupPath = path.join(backupDir, `empleados_backup_${Date.now()}.db`);

      const confirmMessage = await message.reply({
        content: `⚠️ **¿Borrar registros de facturas y servicios?**\n\n` +
                 `✅ - Confirmar (se creará backup en: ${path.basename(backupPath)})\n` +
                 `❌ - Cancelar`,
                 components: [
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId('confirmar_limpieza')
                      .setStyle(ButtonStyle.Success)
                      .setLabel('Confirmar')
                      .setEmoji('✅'),
                    new ButtonBuilder()
                      .setCustomId('cancelar_limpieza')
                      .setStyle(ButtonStyle.Danger)
                      .setLabel('Cancelar')
                      .setEmoji('❌')
                  )
                ]
              });

              const filter = i => i.user.id === message.author.id;
              const collector = confirmMessage.createMessageComponentCollector({ filter, time: 60000 });
  
              collector.on('collect', async i => {
                if (i.customId === 'confirmar_limpieza') {
                  try {
                    // Crear backup
                    await new Promise((resolve, reject) => {
                      fs.copyFile(dbPath, backupPath, (err) => {
                        if (err) reject(err);
                        else resolve();
                      });
                    });
  
                    await limpiarRegistros(db); 
  
                    const backupSize = (fs.statSync(backupPath).size / 1024).toFixed(2);

                    await i.update({
                        content: `✅ **Limpieza completada**\n\n` +
                                 `• Backup creado: \`${path.basename(backupPath)}\` (${backupSize} KB)\n` +
                                 `• Facturas: Borradas\n` +
                                 `• Servicios: Borrados\n` +
                                 `• Empleados: Conservados`,
                        components: []
                      });
    
                      try {
                        await message.author.send({
                          content: '📂 Backup de la base de datos:',
                          files: [backupPath]
                        });
                      } catch (dmError) {
                        console.log('No se pudo enviar backup por DM');
                      }

                    } catch (error) {
                        console.error('Error:', error);
      
                        if (fs.existsSync(backupPath)) {
                          fs.unlinkSync(backupPath);
                        }
      
                        await i.update({
                          content: `❌ **Error en la limpieza:** ${error.message}`,
                          components: []
                        });
                      }
                    } else {
                      await i.update({
                        content: '❌ **Operación cancelada.** No se modificaron datos.',
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