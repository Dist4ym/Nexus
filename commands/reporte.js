const { generarReporte } = require('../database/queries');

module.exports = {
  data: {
    name: 'reporte',
    description: 'Genera un reporte de empleados'
  },
  requiresDB: true, 
  async execute(message, db, args) { 
    try {
      // Verificación de la conexión a DB
      if (!db || typeof db.all !== 'function') {
        console.error('Objeto DB no válido:', db);
        return message.channel.send('❌ Error de conexión con la base de datos');
      }

      console.log('[DEBUG] Tipo de db:', typeof db);
      console.log('[DEBUG] Métodos disponibles:', Object.keys(db).filter(k => typeof db[k] === 'function'));
      const reporte = await generarReporte(db);

      let reporteTexto = "**REPORTE DE EMPLEADOS**\n```\n";
      reporteTexto += "ID EMPLEADO | NOMBRE           | FACTURADO | HORAS  | BONO   | %BONO | #FACTs\n";
      reporteTexto += "------------|------------------|-----------|--------|--------|-------|--------\n";

      reporte.forEach(row => {
        reporteTexto += [
          (row.empleado_id || 'N/A').padEnd(11),
          (row.nombre || 'N/A').substring(0, 16).padEnd(16),
          `$${(row.total_facturado || 0).toFixed(2).padStart(9)}`,
          (row.horas_trabajadas || '0.00').padStart(6),
          `$${(row.bono || '0.00').padStart(6)}`,
          (row.porcentaje_bono || '0%').padStart(5),
          (row.cantidad_facturas || 0).toString().padStart(6)
        ].join('| ') + '\n';
      });

      reporteTexto += "```";
      await message.channel.send(reporteTexto)
      .catch(err => console.error('Error al enviar mensaje:', err));

  } catch (error) {
    console.error('Error en reporte:', {
      message: error.message,
      stack: error.stack,
      args: args 
    });

    const errorMessage = error.message.includes('DB') 
      ? '❌ Error con la base de datos. Por favor verifica la conexión.'
      : `❌ Error al generar el reporte: ${error.message}`;

    await message.channel.send(errorMessage)
      .catch(err => console.error('Error al enviar mensaje de error:', err));
  }
}
};