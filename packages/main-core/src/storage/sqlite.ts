import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

export interface OpenSqliteDatabaseOptions {
  databasePath: string;
  schemaSql?: string;
  pragmas?: readonly string[];
  beforeSchema?: (database: Database.Database) => void;
  afterSchema?: (database: Database.Database) => void;
}

export const defaultSqlitePragmas = [
  'foreign_keys = ON',
  'journal_mode = WAL',
  'busy_timeout = 5000'
] as const;

export const openSqliteDatabase = ({
  databasePath,
  schemaSql,
  pragmas = defaultSqlitePragmas,
  beforeSchema,
  afterSchema
}: OpenSqliteDatabaseOptions): Database.Database => {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new Database(databasePath);
  for (const pragma of pragmas) {
    database.pragma(pragma);
  }
  beforeSchema?.(database);
  if (schemaSql) database.exec(schemaSql);
  afterSchema?.(database);
  return database;
};

export const ensureSqliteColumn = (
  database: Database.Database,
  table: string,
  column: string,
  definition: string
): void => {
  const rows = database.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (rows.some((row) => row.name === column)) return;
  database.exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
};
