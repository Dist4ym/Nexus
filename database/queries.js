module.exports = {

    insertarFactura: (db, empleadoId, monto, moneda, fecha) => {
      return new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO facturas (empleado_id, monto, moneda, fecha_hora) VALUES (?, ?, ?, ?)',
          [empleadoId, parseFloat(monto), moneda, fecha],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
    },

    insertarEmpleado: (db, empleadoId, nombre) => {
        return new Promise((resolve, reject) => {
          db.run(
            'INSERT OR IGNORE INTO empleados (id, nombre) VALUES (?, ?)',
            [empleadoId, nombre],
            function(err) {
              if (err) reject(err);
              else resolve(this.changes);
            }
          );
        });
      },

      insertarServicio: (db, empleadoId, tipo, fecha, callback) => {
        db.run(
          'INSERT INTO servicios (empleado_id, tipo, fecha_hora) VALUES (?, ?, ?)',
          [empleadoId, tipo, fecha],
          callback
        );
      },

      generarReporte: (db) => {
        return new Promise((resolve, reject) => {
    
          if (!db || typeof db.all !== 'function') {
            return reject(new Error('Conexión a DB no válida'));
          }
    
          const query = `
            SELECT 
              e.id as empleado_id,
              e.nombre,
              COALESCE(SUM(f.monto), 0) as total_facturado,
              COUNT(f.id) as cantidad_facturas,
              (SELECT strftime('%s', MAX(s.fecha_hora)) - strftime('%s', MIN(s.fecha_hora)) 
               FROM servicios s 
               WHERE s.empleado_id = e.id AND s.tipo = 'entrada') as segundos_trabajados
            FROM empleados e
            LEFT JOIN facturas f ON e.id = f.empleado_id
            GROUP BY e.id, e.nombre
          `;

          db.all(query, (err, rows) => {
            if (err) return reject(err);
    
            const reporte = rows.map(row => {
              const horasTrabajadas = row.segundos_trabajados ? (row.segundos_trabajados / 3600).toFixed(2) : '0.00';
    
              let porcentajeBono = 0;
              const horas = parseFloat(horasTrabajadas);
    
              if (horas < 8) porcentajeBono = 0.08;
              else if (horas >= 8 && horas < 10) porcentajeBono = 0.10;
              else if (horas >= 10 && horas < 14) porcentajeBono = 0.13;
              else if (horas >= 14 && horas < 20) porcentajeBono = 0.15;
              else porcentajeBono = 0.20;

              return {
                ...row,
                horas_trabajadas: horasTrabajadas,
                bono: (row.total_facturado * porcentajeBono).toFixed(2),
                porcentaje_bono: `${(porcentajeBono * 100).toFixed(0)}%`
              };
            });
    
            resolve(reporte);
          });
        });
      },

      limpiarDatosCompletos: async (db) => {
        return new Promise((resolve, reject) => {
          db.serialize(() => {
            db.run('BEGIN TRANSACTION');
    
            db.run('DELETE FROM facturas', (err) => {
              if (err) return reject(err);
    
              db.run('DELETE FROM servicios', (err) => {
                if (err) return reject(err);
    
                db.run('DELETE FROM empleados', (err) => {
                  if (err) return reject(err);
    
                  db.run('DELETE FROM movimientos_fondos', (err) => {
                    if (err) return reject(err);
    
                    db.run('COMMIT', (err) => {
                      if (err) return reject(err);
    
                      db.run('VACUUM', (err) => {
                        if (err) reject(err);
                        else resolve();
                    }); 
                }); 
              }); 
            }); 
          }); 
        }); 
      });
    }); 
  },

  limpiarRegistros: async (db) => { 
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run('DELETE FROM facturas', (err) => {
          if (err) return reject(err);

          db.run('DELETE FROM servicios', (err) => {
            if (err) return reject(err);

            db.run('COMMIT', (err) => {
              if (err) return reject(err);
              db.run('VACUUM', (err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          });
        });
      });
    });
  },

   // TABLA MOMENT
   insertarMovimiento: (db, empleadoId, nombre, tipo, monto, moneda, fecha) => {
    return new Promise((resolve, reject) => {
      // Validación adicional
      if (!db || typeof db.run !== 'function') {
        return reject(new Error('Conexión a DB no válida'));
      }

      db.run(
        'INSERT INTO movimientos_fondos (empleado_id, nombre, tipo, monto, moneda, fecha_hora) VALUES (?, ?, ?, ?, ?, ?)',
        [empleadoId, nombre, tipo, parseFloat(monto), moneda, fecha],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  obtenerMovimientos: (db, limite = 10) => {
    return new Promise((resolve, reject) => {
      // Verificación adicional
      if (!db || typeof db.all !== 'function') {
        return reject(new Error('Conexión a DB no válida'));
      }

      const query = `
        SELECT 
          m.*,
          e.nombre as nombre_empleado
        FROM movimientos_fondos m
        LEFT JOIN empleados e ON m.empleado_id = e.id
        ORDER BY m.fecha_hora DESC
        LIMIT ?
      `;

      db.all(query, [limite], (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(row => ({
          ...row,
          nombre: row.nombre_empleado || row.nombre || 'N/A'
        })));
      });
    });
  },

  obtenerBalanceTotal: (db) => {
    return new Promise((resolve, reject) => {
      if (!db || typeof db.get !== 'function') {
        return reject(new Error('Conexión a DB no válida'));
      }

      const query = `
        SELECT 
          SUM(CASE WHEN tipo = 'deposito' THEN monto ELSE 0 END) as total_depositos,
          SUM(CASE WHEN tipo = 'retiro' THEN monto ELSE 0 END) as total_retiros,
          SUM(CASE WHEN tipo = 'facturacion' THEN monto ELSE 0 END) as total_facturado,
          (SUM(CASE WHEN tipo = 'deposito' THEN monto ELSE 0 END) + 
           SUM(CASE WHEN tipo = 'facturacion' THEN monto ELSE 0 END) -
           SUM(CASE WHEN tipo = 'retiro' THEN monto ELSE 0 END)) as balance
        FROM movimientos_fondos
      `;

      db.get(query, (err, row) => {
        if (err) reject(err);
        else resolve(row || {
          total_depositos: 0,
          total_retiros: 0,
          total_facturado: 0,
          balance: 0
        });
      });
    });
  }
};