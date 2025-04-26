const { db, dbPath } = require('./database/connection');
const { insertarFactura, insertarEmpleado, insertarMovimiento } = require('./database/queries');

const args = process.argv.slice(2);
if (args.length !== 3) {
  console.error('Uso: node registrarFactura.js <ID_EMPLEADO> "<NOMBRE_EMPLEADO>" <MONTO>');
  console.error('Ejemplo: node registrarFactura.js EMP123 "Juan Perez" 1500');
  process.exit(1);
}

const [idEmpleado, nombreEmpleado, montoStr] = args;
const montoFactura = parseFloat(montoStr);

if (!idEmpleado || !nombreEmpleado || isNaN(montoFactura) || montoFactura <= 0) {
  console.error('Error: Datos inválidos');
  console.error('• ID debe ser texto');
  console.error('• Nombre debe estar entre comillas si contiene espacios');
  console.error('• Monto debe ser un número positivo');
  process.exit(1);
}

(async () => {
  try {
    const fechaHora = new Date().toISOString();
    
    await insertarEmpleado(db, idEmpleado, nombreEmpleado);
    await insertarFactura(db, idEmpleado, montoFactura, 'USD', fechaHora);
    await insertarMovimiento(db, idEmpleado, nombreEmpleado, 'facturacion', montoFactura, 'USD', fechaHora);

    console.log('✅ Factura registrada exitosamente:');
    console.log(`ID Empleado: ${idEmpleado}`);
    console.log(`Nombre: ${nombreEmpleado}`);
    console.log(`Monto: $${montoFactura.toFixed(2)}`);
    console.log(`Fecha: ${new Date(fechaHora).toLocaleString()}`);

  } catch (error) {
    console.error('❌ Error al registrar factura:', error.message);
    process.exit(1);
  } finally {
    db.close();
  }
})();