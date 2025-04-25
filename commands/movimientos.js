const { obtenerMovimientos, obtenerBalanceTotal } = require('../database/queries');

module.exports = {
  data: {
    name: 'movimientos',
    description: 'Muestra los últimos movimientos de fondos y el balance total'
  },
  requiresDB: true, // Añade esta línea
  async execute(message, db) { // Asegúrate de recibir solo message y db
    try {
      // Verificación de la conexión a DB
      if (!db || typeof db.all !== 'function') {
        console.error('DB no válida en movimientos:', db);
        return message.channel.send('❌ Error de conexión con la base de datos');
      }

      const movimientos = await obtenerMovimientos(db);
      const balance = await obtenerBalanceTotal(db);

      let respuesta = "**📊 MOVIMIENTOS DE FONDOS**\n\n";
      respuesta += "```\n";
      respuesta += "FECHA/HORA         | TIPO       | EMPLEADO         | MONTO\n";
      respuesta += "-------------------|------------|------------------|--------\n";

      movimientos.forEach(mov => {
        const fecha = new Date(mov.fecha_hora).toLocaleString();
        respuesta += `${fecha.padEnd(19)}| `;
        respuesta += `${mov.tipo.padEnd(11)}| `;
        respuesta += `${(mov.nombre || 'N/A').substring(0, 16).padEnd(16)}| `;
        respuesta += `$${mov.monto.toFixed(2).padStart(7)}\n`;
      });

      respuesta += "```\n\n";
      respuesta += "**BALANCE TOTAL**\n";
      respuesta += `💰 Total depósitos: $${balance.total_depositos?.toFixed(2) || '0.00'}\n`;
      respuesta += `💸 Total retiros: $${balance.total_retiros?.toFixed(2) || '0.00'}\n`;
      respuesta += `📝 Total facturado: $${balance.total_facturado?.toFixed(2) || '0.00'}\n`;
      respuesta += `🏦 Balance disponible: $${balance.balance?.toFixed(2) || '0.00'}\n`;

      await message.channel.send(respuesta);
    } catch (error) {
      console.error('Error en comando movimientos:', {
        error: error.message,
        stack: error.stack,
        dbType: typeof db,
        dbMethods: db ? Object.keys(db).filter(k => typeof db[k] === 'function') : 'null'
      });
      message.channel.send('❌ Error al obtener los movimientos: ' + error.message);
    }
  }
};