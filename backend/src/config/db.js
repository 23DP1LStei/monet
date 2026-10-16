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
      role_id INTEGER NOT NULL DEFAULT 2,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (role_id) REFERENCES roles (role_id)
    );

    CREATE TABLE IF NOT EXISTS coworking_spaces (
      space_id INTEGER PRIMARY KEY AUTOINCREMENT,
      creator_id INTEGER NOT NULL,
      space_name TEXT NOT NULL,
      city TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL,
      space_type TEXT NOT NULL DEFAULT 'hot-desk' CHECK (space_type IN ('hot-desk','dedicated','private-office','meeting-room')),
      space_description TEXT,
      available_spots INTEGER NOT NULL DEFAULT 1,
      price_per_hour REAL NOT NULL DEFAULT 0.00,
      price_per_day REAL NOT NULL DEFAULT 0.00,
      is_instant_book INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      amenities TEXT DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (creator_id) REFERENCES users (user_id)
    );

    CREATE TABLE IF NOT EXISTS photos (
      photo_id INTEGER PRIMARY KEY AUTOINCREMENT,
      space_id INTEGER NOT NULL,
      photo_path TEXT NOT NULL,
      FOREIGN KEY (space_id) REFERENCES coworking_spaces (space_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reservations (
      reservation_id INTEGER PRIMARY KEY AUTOINCREMENT,
      space_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      reservation_type TEXT NOT NULL DEFAULT 'individual' CHECK (reservation_type IN ('individual','group')),
      guest_count INTEGER NOT NULL DEFAULT 1,
      amount REAL NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      reservation_status TEXT NOT NULL DEFAULT 'pending' CHECK (reservation_status IN ('pending','confirmed','canceled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (space_id) REFERENCES coworking_spaces (space_id),
      FOREIGN KEY (user_id) REFERENCES users (user_id)
    );

    CREATE TABLE IF NOT EXISTS payment_history (
      payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'successful' CHECK (payment_status IN ('successful','failed','refunded')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (reservation_id) REFERENCES reservations (reservation_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      review_id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id INTEGER NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      space_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (reservation_id) REFERENCES reservations (reservation_id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (user_id),
      FOREIGN KEY (space_id) REFERENCES coworking_spaces (space_id) ON DELETE CASCADE
    );
  `);

  try {
    sqliteDb.exec("ALTER TABLE coworking_spaces ADD COLUMN amenities TEXT DEFAULT '[]'");
  } catch {
    // Column already exists
  }
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
