import Database from 'better-sqlite3';
import { openSqliteDatabase } from '@tnet/main-core/storage/sqlite';
import { dbInspectorDatabasePath } from '../dbInspectorPaths';
import schemaSql from '../migrations/schema.sql?raw';

export type DbInspectorDatabase = Database.Database;

export const openDbInspectorDatabase = (userDataDir: string): DbInspectorDatabase => {
  return openSqliteDatabase({
    databasePath: dbInspectorDatabasePath(userDataDir),
    schemaSql
  });
};
