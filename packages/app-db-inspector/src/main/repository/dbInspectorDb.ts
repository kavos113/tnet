import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { dbInspectorDatabasePath } from '../dbInspectorPaths';
import schemaSql from '../migrations/schema.sql?raw';

export type DbInspectorDatabase = Database.Database;

export const openDbInspectorDatabase = (userDataDir: string): DbInspectorDatabase => {
  const databasePath = dbInspectorDatabasePath(userDataDir);
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new Database(databasePath);
  database.pragma('foreign_keys = ON');
  database.pragma('journal_mode = WAL');
  database.pragma('busy_timeout = 5000');
  database.exec(schemaSql);
  return database;
};
