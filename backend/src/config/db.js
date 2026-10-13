import mysql from 'mysql2/promise';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mysqlPool = null;
let sqliteDb = null;
let activeDriver = null;

/**
 * Inicializē un izveido savienojumu ar datubāzi.
 * Ja DB_DRIVER=sqlite vai MySQL pieslēgums nav pieejams, automātiski
 * pārslēdzas uz SQLite, nodrošinot tūlītēju darbību bez papildu konfigurācijas.
 */
export async function initDatabase() {
  const driverPref = (process.env.DB_DRIVER || 'mysql').toLowerCase();

  if (driverPref === 'mysql') {
    try {
      mysqlPool = mysql.createPool({
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'monet_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8mb4',
      });

      // Pārbauda savienojumu
      const conn = await mysqlPool.getConnection();
      conn.release();
      activeDriver = 'mysql';
      console.log(' Pieslēgts MySQL datubāzei:', process.env.DB_NAME || 'monet_db');
      await seedRolesIfEmpty();
      return activeDriver;
    } catch (err) {
      console.warn(`⚠️ MySQL pieslēguma kļūda (${err.message}). Pāreja uz lokālo SQLite krātuvi izstrādei.`);
      mysqlPool = null;
    }
  }

  // SQLite rezerves variants vai noklusējuma izvēle
  try {
    const dataDir = path.resolve(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = process.env.DB_SQLITE_PATH || path.join(dataDir, 'monet.sqlite');
    sqliteDb = new DatabaseSync(dbPath);
    activeDriver = 'sqlite';
    console.log(' Tiek izmantota SQLite datubāze:', dbPath);
    initSqliteTables();
    seedRolesIfEmpty();
    return activeDriver;
  } catch (err) {
    console.error('❌ Neizdevās inicializēt SQLite datubāzi:', err);
    throw err;
  }
}

/**
 * Izveido nepieciešamās tabulas SQLite vidē, ja tās vēl neeksistē
 */
function initSqliteTables() {
  if (!sqliteDb) return;

  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      role_id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE CHECK (length(username) >= 3 AND length(username) <= 20),
      fname TEXT NOT NULL CHECK (length(fname) <= 50 AND fname NOT GLOB '*[0-9]*'),
      surname TEXT NOT NULL CHECK (length(surname) <= 50 AND surname NOT GLOB '*[0-9]*'),
      email TEXT NOT NULL UNIQUE CHECK (length(email) <= 50 AND email LIKE '%@%.%'),
      phone_number TEXT NOT NULL UNIQUE CHECK (length(phone_number) >= 7 AND length(phone_number) <= 15),
      role_id INTEGER NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (role_id) REFERENCES roles (role_id)
    );
  `);
}

/**
 * Aizpilda sākotnējās lietotāju lomas (guest, user, landlord, admin)
 */
async function seedRolesIfEmpty() {
  const roles = [
    { id: 1, name: 'guest' },
    { id: 2, name: 'user' },
    { id: 3, name: 'landlord' },
    { id: 4, name: 'admin' },
  ];

  for (const role of roles) {
    if (activeDriver === 'mysql') {
      try {
        await mysqlPool.query(
          'INSERT IGNORE INTO roles (role_id, role_name) VALUES (?, ?)',
          [role.id, role.name]
        );
      } catch {
        // Ignorē, ja tabula vēl nav izveidota vai ieraksts jau eksistē
      }
    } else if (activeDriver === 'sqlite') {
      try {
        const stmt = sqliteDb.prepare(
          'INSERT OR IGNORE INTO roles (role_id, role_name) VALUES (?, ?)'
        );
        stmt.run(role.id, role.name);
      } catch {
        // Ignorē, ja ieraksts jau eksistē
      }
    }
  }
}

/**
 * Izpilda SQL vaicājumu gan MySQL, gan SQLite vidē ar vienotu parametru apstrādi
 * @param {string} sql SQL vaicājums
 * @param {Array} params Piesaistītie parametri
 * @returns {Promise<{ rows: Array, insertId: number, affectedRows: number }>}
 */
export async function query(sql, params = []) {
  if (!activeDriver) {
    await initDatabase();
  }

  if (activeDriver === 'mysql') {
    const [result] = await mysqlPool.execute(sql, params);
    if (Array.isArray(result)) {
      return { rows: result, insertId: null, affectedRows: result.length };
    }
    return {
      rows: [],
      insertId: result.insertId || null,
      affectedRows: result.affectedRows || 0,
    };
  }

  if (activeDriver === 'sqlite') {
    const trimmed = sql.trim();
    const isSelect = /^SELECT/i.test(trimmed);

    const stmt = sqliteDb.prepare(sql);
    if (isSelect) {
      const rows = stmt.all(...params);
      return { rows, insertId: null, affectedRows: rows.length };
    } else {
      const info = stmt.run(...params);
      return {
        rows: [],
        insertId: info.lastInsertRowid !== undefined ? Number(info.lastInsertRowid) : null,
        affectedRows: info.changes || 0,
      };
    }
  }

  throw new Error('Datubāzes draiveris nav inicializēts.');
}

/**
 * Atgriež aktīvā draivera nosaukumu ('mysql' | 'sqlite')
 */
export function getDriverName() {
  return activeDriver;
}

/**
 * Aizver savienojumu ar datubāzi
 */
export async function closeDatabase() {
  if (mysqlPool) {
    await mysqlPool.end();
    mysqlPool = null;
  }
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
  }
  activeDriver = null;
}
