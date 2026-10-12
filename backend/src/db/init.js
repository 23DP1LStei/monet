import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { initDatabase, closeDatabase, getDriverName } from '../config/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log(' Sākas datubāzes inicializācija...');

  const dbHost = process.env.DB_HOST || '127.0.0.1';
  const dbPort = Number(process.env.DB_PORT) || 3306;
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'monet_db';

  if ((process.env.DB_DRIVER || 'mysql').toLowerCase() === 'mysql') {
    try {
      console.log(` Mēģinājums izveidot MySQL savienojumu ar ${dbHost}:${dbPort}...`);
      const connection = await mysql.createConnection({
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        multipleStatements: true,
      });

      const schemaSqlPath = path.join(__dirname, 'schema.sql');
      const sql = fs.readFileSync(schemaSqlPath, 'utf8');

      console.log(` Izpilda shēmas skriptu no ${schemaSqlPath}...`);
      await connection.query(sql);
      await connection.end();

      console.log(' MySQL shēma veiksmīgi inicializēta!');
      return;
    } catch (err) {
      console.warn(`⚠️ MySQL inicializācijas kļūda: ${err.message}`);
      console.log(' Pāreja uz SQLite inicializāciju...');
    }
  }

  // Rezerves variants: SQLite inicializācija
  await initDatabase();
  console.log(` Datubāze inicializēta, izmantojot draiveri: ${getDriverName()}`);
  await closeDatabase();
}

runMigrations()
  .then(() => {
    console.log(' Datubāzes inicializācija pabeigta.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Datubāzes inicializācija neizdevās:', err);
    process.exit(1);
  });
