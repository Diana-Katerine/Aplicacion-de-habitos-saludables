import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || path.resolve(__dirname, '../../data/habitos.db');

// Asegurar directorio para la base de datos
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);

// Configurar pragmas para rendimiento y consistencia
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

export function initDatabase() {
  const migrationPath = path.resolve(__dirname, 'migrations.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  db.exec(sql);
}

// Inicializar la base de datos de inmediato al importar el módulo
initDatabase();
