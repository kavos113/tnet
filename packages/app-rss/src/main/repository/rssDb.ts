import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import schemaSql from '../migrations/schema.sql?raw';
import { rssDatabasePath } from '../rssPaths';

export type RssDatabase = Database.Database;

export const openRssDatabase = (userDataDir: string): RssDatabase => {
  const databasePath = rssDatabasePath(userDataDir);
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new Database(databasePath);
  database.pragma('foreign_keys = ON');
  database.pragma('journal_mode = WAL');
  database.pragma('busy_timeout = 5000');
  database.exec(schemaSql);
  return database;
};
