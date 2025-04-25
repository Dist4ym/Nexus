const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ruta persistente en Fly.io (usando volumen)
const dbPath = process.env.FLY ? '/data/empleados.db' : path.resolve(__dirname, '../empleados.db');

// Crear directorio /data si no existe (solo en Fly.io)
if (process.env.FLY && !fs.existsSync('/data')) {
  fs.mkdirSync('/data');
}

// Crear archivo de DB si no existe
if (!fs.existsSync(dbPath)) {
  fs.closeSync(fs.openSync(dbPath, 'w'));
}

// Conexión a la base de datos
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('[ERROR] DB:', err);
    throw err;
  }
  console.log(`[INFO] DB conectada en: ${dbPath}`);
});

// Crear tablas
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS empleados (
    id TEXT PRIMARY KEY,
    nombre TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS servicios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empleado_id TEXT,
    tipo TEXT,
    fecha_hora DATETIME,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS facturas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empleado_id TEXT,
    monto REAL,
    moneda TEXT DEFAULT 'USD',
    fecha_hora DATETIME,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS movimientos_fondos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empleado_id TEXT,
    nombre TEXT,
    tipo TEXT CHECK(tipo IN ('deposito', 'retiro', 'facturacion')),
    monto REAL,
    moneda TEXT DEFAULT 'USD',
    fecha_hora DATETIME,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id)
  )`);
});

module.exports = { db, dbPath };