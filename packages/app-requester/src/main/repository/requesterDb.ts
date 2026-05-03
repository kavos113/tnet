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
  migrateLegacyHistorySchema(database);
  database.exec(schemaSql);
  return database;
};

const migrateLegacyHistorySchema = (database: RequesterDatabase): void => {
  const historyTable = database
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'history_entries'")
    .get();
  if (!historyTable) return;

  const columns = database.pragma('table_info(history_entries)') as Array<{ name: string }>;
  if (!columns.some((column) => column.name === 'request_snapshot_json')) return;

  database.exec(`
    PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS response_blobs;
    DROP TABLE IF EXISTS history_request_headers;
    DROP TABLE IF EXISTS history_response_headers;
    DROP TABLE IF EXISTS history_entries;
    DELETE FROM requester_schema_migrations WHERE version >= 2;
    PRAGMA foreign_keys = ON;
  `);
};
