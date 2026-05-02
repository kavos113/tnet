import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { tasksDatabasePath } from '../tasksPaths';
import compatibilitySql from '../migrations/compatibility.sql?raw';
import schemaSql from '../migrations/schema.sql?raw';

export type TasksDatabase = Database.Database;

export const openTasksDatabase = (userDataDir: string): TasksDatabase => {
  const databasePath = tasksDatabasePath(userDataDir);
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new Database(databasePath);
  database.pragma('foreign_keys = ON');
  database.pragma('journal_mode = WAL');
  database.pragma('busy_timeout = 5000');
  database.exec(schemaSql);
  ensureCurrentSchema(database);
  return database;
};

const ensureCurrentSchema = (database: TasksDatabase): void => {
  ensureColumn(database, 'tasks', 'reminder_minutes_before', 'reminder_minutes_before INTEGER');
  ensureColumn(database, 'tasks', 'recurrence_rule', 'recurrence_rule TEXT');
  ensureColumn(database, 'tasks', 'linked_entity_id', 'linked_entity_id TEXT');
  ensureColumn(database, 'tasks', 'source_url', 'source_url TEXT');
  ensureColumn(
    database,
    'calendar_sources',
    'item_kind',
    "item_kind TEXT NOT NULL DEFAULT 'event'"
  );
  ensureColumn(database, 'calendar_sources', 'purpose', "purpose TEXT NOT NULL DEFAULT 'calendar'");
  ensureColumn(
    database,
    'calendar_sources',
    'write_back_enabled',
    'write_back_enabled INTEGER NOT NULL DEFAULT 0'
  );
  ensureColumn(database, 'calendar_sources', 'auth_type', "auth_type TEXT NOT NULL DEFAULT 'none'");
  ensureColumn(database, 'calendar_sources', 'username', 'username TEXT');
  ensureColumn(database, 'calendar_sources', 'password_secret_id', 'password_secret_id TEXT');
  ensureColumn(
    database,
    'calendar_sources',
    'google_token_secret_id',
    'google_token_secret_id TEXT'
  );
  database.exec(compatibilitySql);
};

const ensureColumn = (
  database: TasksDatabase,
  table: 'tasks' | 'calendar_sources',
  column: string,
  definition: string
): void => {
  const rows = database.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string;
  }>;
  if (rows.some((row) => row.name === column)) return;
  database.exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
};
