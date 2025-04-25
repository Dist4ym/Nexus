const { facturaPattern, servicioPattern, depositoPattern, retiroPattern } = require('../utils/patterns');
const { insertarFactura, insertarEmpleado, insertarServicio, insertarMovimiento } = require('../database/queries');

const CANAL_REGISTROS_ID = '1339739756178968607';
const CANAL_FONDOS_ID = '1339873049528238080'; 

module.exports = {
  name: 'messageCreate',
  async execute(message, client, db) {
    try {
        if (message.channel.id !== CANAL_REGISTROS_ID) return;

      const content = message.content.trim();
      const now = new Date().toISOString();

      // Procesar RETIROS (nueva sección)
      const retiroMatch = content.match(retiroPattern);
      if (retiroMatch) {
        const [, codigo, nombre, montoStr] = retiroMatch;
        const monto = parseFloat(montoStr.replace(/[`,]/g, '')); // Elimina backticks y comas

        console.log(`[RETIRO] Procesando: ${codigo} - ${nombre} - $${monto}`);

        try {
            await insertarMovimiento(db, codigo, nombre, 'retiro', monto, 'USD', now);

            // Reenviar al canal de fondos
            const canalFondos = await client.channels.fetch(CANAL_FONDOS_ID);
            if (canalFondos) {
              await canalFondos.send({
                content: `💸 **Retiro realizado**\n` +
                       `👤 ${nombre} (${codigo})\n` + 
                       `💵 $${monto.toLocaleString('en-US')}\n` +
                       `🕒 ${new Date().toLocaleString()}`
              });
            } else {
              console.error('Canal de fondos no encontrado');
            }
            await message.react('✅').catch(console.error);
            console.log(`[RETIRO] Registrado: ${codigo} - $${monto}`);

          } catch (error) {
            console.error('Error al registrar retiro:', error);
            await message.react('❌').catch(console.error);
            await message.reply(`❌ Error al registrar retiro: ${error.message}`).catch(console.error);
          }
          return;
        }

        // Procesar DEPÓSITOS
        const depositoMatch = content.match(depositoPattern);
        if (depositoMatch) {
        const [, codigo, nombre, montoStr] = depositoMatch;
        const monto = parseFloat(montoStr.replace(/[`,]/g, '')); // Elimina backticks y comas

        console.log(`[DEPOSITO] Procesando: ${codigo} - ${nombre} - $${monto}`);

        try {
          // Insertar en movimientos_fondos
          await insertarMovimiento(db, codigo, nombre, 'deposito', monto, 'USD', now);

          // Reenviar al canal de fondos
          const canalFondos = await client.channels.fetch(CANAL_FONDOS_ID);
          if (canalFondos) {
            await canalFondos.send({
              content: `💰 **Depósito recibido**\n` +
                     `👤 ${nombre} (${codigo})\n` + 
                     `💵 $${monto.toLocaleString('en-US')}\n` +
                     `🕒 ${new Date().toLocaleString()}`
            });
          } else {
            console.error('Canal de fondos no encontrado');
          }

          await message.react('✅').catch(console.error);
          console.log(`[DEPOSITO] Registrado: ${codigo} - $${monto}`);
            } catch (error) {
          console.error('Error al registrar depósito:', error);
          await message.react('❌').catch(console.error);
          await message.reply(`❌ Error al registrar depósito: ${error.message}`).catch(console.error);
        }
        return;
        }
        
       // Procesar FACTURAS 
       const facturaMatch = content.match(facturaPattern);
       if (facturaMatch) {
         const [, codigoEmpleado, monto] = facturaMatch;
         try {
           await insertarFactura(db, codigoEmpleado, monto, 'USD', now);
 
           const empleado = await new Promise((resolve, reject) => {
             db.get('SELECT nombre FROM empleados WHERE id = ?', [codigoEmpleado], (err, row) => {
               if (err) reject(err);
               else resolve(row);
             });
           });
 
           if (empleado) {
             await insertarMovimiento(db, codigoEmpleado, empleado.nombre, 'facturacion', monto, 'USD', now);
           }
           await message.react('💰').catch(console.error);
           console.log(`[FACTURA] ${codigoEmpleado} - $${monto}`);
         } catch (error) {
           console.error(`[ERROR-FACTURA] ${codigoEmpleado}:`, error.message);
           await message.react('❌').catch(console.error);
         }
         return;
       }
       
        // SERVICIOS
      const servicioMatch = content.match(servicioPattern);
      if (servicioMatch) {
        const [, codigoEmpleado, nombreCompleto, tipoAccion] = servicioMatch;
        const tipoServicio = tipoAccion.toLowerCase() === 'entrado' ? 'entrada' : 'salida';
        try {
          await insertarEmpleado(db, codigoEmpleado, nombreCompleto);
          await insertarServicio(db, codigoEmpleado, tipoServicio, now);
          await message.react(tipoServicio === 'entrada' ? '🟢' : '🔴').catch(console.error);
          console.log(`✅ Servicio registrado: ${nombreCompleto} (${codigoEmpleado}) - ${tipoServicio}`);
        } catch (error) {
          console.error(`❌ Error en servicio ${codigoEmpleado}:`, error.message);
          await message.react('❌').catch(console.error);
        }
      return;
        }

        } catch (error) {
        console.error('Error general en messageCreate:', error);
     }
    }
};