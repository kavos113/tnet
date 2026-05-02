import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { requesterDatabasePath } from '../requesterPaths';
import schemaSql from '../migrations/schema.sql?raw';

export type RequesterDatabase = Database.Database;

export const openRequesterDatabase = (userDataDir: string): RequesterDatabase => {
  const databasePath = requesterDatabasePath(userDataDir);
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new Database(databasePath);
  database.pragma('foreign_keys = ON');
  database.pragma('journal_mode = WAL');
  database.pragma('busy_timeout = 5000');
  database.exec(schemaSql);
  return database;
};
