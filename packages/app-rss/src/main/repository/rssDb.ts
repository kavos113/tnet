import Database from 'better-sqlite3';
import { openSqliteDatabase } from '@tnet/main-core/storage/sqlite';
import schemaSql from '../migrations/schema.sql?raw';
import { rssDatabasePath } from '../rssPaths';

export type RssDatabase = Database.Database;

export const openRssDatabase = (userDataDir: string): RssDatabase => {
  return openSqliteDatabase({
    databasePath: rssDatabasePath(userDataDir),
    schemaSql
  });
};
