import fs from 'fs';
import Database from 'better-sqlite3';
import type {
  DatabaseColumn,
  DatabaseForeignKey,
  DatabaseIndex,
  DatabaseSchemaSnapshot,
  DatabaseTable,
  DbInspectorConnection,
  ExecuteQueryRequest,
  LoadTablePageRequest,
  QueryExecutionResult,
  TablePageResult
} from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import { assertSingleStatement, isMutatingSql } from '@tnet/app-db-inspector/shared/sqlModel';
import type { DatabaseDriver } from './databaseDriver';

interface SqliteTableRow {
  name: string;
  type: 'table' | 'view';
}

interface SqliteTableInfoRow {
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

interface SqliteForeignKeyRow {
  id: number;
  table: string;
  from: string;
  to: string;
}

interface SqliteIndexListRow {
  name: string;
  unique: number;
  origin: string;
}

interface SqliteIndexInfoRow {
  name: string;
}

const ensureSqliteConnection = (connection: DbInspectorConnection) => {
  if (connection.driver !== 'sqlite') throw new Error(`Unsupported driver: ${connection.driver}`);
  if (!connection.databasePath.trim()) throw new Error('SQLite database path is required.');
  if (!fs.existsSync(connection.databasePath)) {
    throw new Error(`SQLite database was not found: ${connection.databasePath}`);
  }
  return connection;
};

const openSqlite = (connection: DbInspectorConnection): Database.Database => {
  const sqliteConnection = ensureSqliteConnection(connection);
  return new Database(sqliteConnection.databasePath, {
    readonly: sqliteConnection.readOnly,
    fileMustExist: true
  });
};

const quoteIdentifier = (identifier: string): string => `"${identifier.replace(/"/g, '""')}"`;

const tableReference = (schemaName: string | undefined, tableName: string): string =>
  schemaName && schemaName !== 'main'
    ? `${quoteIdentifier(schemaName)}.${quoteIdentifier(tableName)}`
    : quoteIdentifier(tableName);

const normalizePageSize = (pageSize: number): number =>
  Math.min(Math.max(Math.floor(pageSize), 1), 500);

const columnsFromTableInfo = (rows: SqliteTableInfoRow[]): DatabaseColumn[] =>
  rows.map((row) => ({
    name: row.name,
    type: row.type,
    nullable: row.notnull === 0 && row.pk === 0,
    defaultValue: row.dflt_value ?? undefined,
    primaryKeyOrdinal: row.pk || undefined
  }));

const foreignKeysFromRows = (rows: SqliteForeignKeyRow[]): DatabaseForeignKey[] => {
  const byId = new Map<number, SqliteForeignKeyRow[]>();
  rows.forEach((row) => byId.set(row.id, [...(byId.get(row.id) ?? []), row]));
  return [...byId.values()].map((group) => ({
    columns: group.map((row) => row.from),
    referencedTableName: group[0].table,
    referencedColumns: group.map((row) => row.to)
  }));
};

export class SqliteDriver implements DatabaseDriver {
  async testConnection(connection: DbInspectorConnection): Promise<void> {
    const database = openSqlite(connection);
    try {
      database.prepare('SELECT 1').get();
    } finally {
      database.close();
    }
  }

  async introspect(connection: DbInspectorConnection): Promise<DatabaseSchemaSnapshot> {
    const database = openSqlite(connection);
    try {
      const objects = database
        .prepare(
          `SELECT name, type
           FROM sqlite_master
           WHERE type IN ('table', 'view')
             AND name NOT LIKE 'sqlite_%'
           ORDER BY type, name`
        )
        .all() as SqliteTableRow[];

      const tables: DatabaseTable[] = objects
        .filter((object) => object.type === 'table')
        .map((object) => {
          const columns = this.loadColumns(database, object.name);
          return {
            schemaName: 'main',
            name: object.name,
            columns,
            primaryKey: columns
              .filter((column) => column.primaryKeyOrdinal)
              .sort((left, right) => (left.primaryKeyOrdinal ?? 0) - (right.primaryKeyOrdinal ?? 0))
              .map((column) => column.name),
            foreignKeys: foreignKeysFromRows(
              database
                .prepare(`PRAGMA foreign_key_list(${quoteIdentifier(object.name)})`)
                .all() as SqliteForeignKeyRow[]
            ),
            indexes: this.loadIndexes(database, object.name)
          };
        });

      const views = objects
        .filter((object) => object.type === 'view')
        .map((object) => ({
          schemaName: 'main',
          name: object.name,
          columns: this.loadColumns(database, object.name)
        }));

      return {
        refreshedAt: new Date().toISOString(),
        schemas: [{ name: 'main', tables, views }]
      };
    } finally {
      database.close();
    }
  }

  async loadTablePage(
    connection: DbInspectorConnection,
    request: LoadTablePageRequest
  ): Promise<TablePageResult> {
    const database = openSqlite(connection);
    try {
      const pageSize = normalizePageSize(request.pageSize);
      const page = Math.max(Math.floor(request.page), 0);
      const columns = this.loadColumns(database, request.tableName);
      const table = tableReference(request.schemaName, request.tableName);
      const filter = request.filter?.trim();
      const searchableColumns = columns.map((column) => column.name);
      const whereSql =
        filter && searchableColumns.length > 0
          ? `WHERE ${searchableColumns
              .map((column) => `CAST(${quoteIdentifier(column)} AS TEXT) LIKE @filter`)
              .join(' OR ')}`
          : '';
      const sortColumn = request.sort?.column;
      const sortSql =
        sortColumn && searchableColumns.includes(sortColumn)
          ? `ORDER BY ${quoteIdentifier(sortColumn)} ${request.sort?.direction === 'desc' ? 'DESC' : 'ASC'}`
          : '';
      const params = filter
        ? { filter: `%${filter}%`, limit: pageSize, offset: page * pageSize }
        : { limit: pageSize, offset: page * pageSize };
      const totalRows = (
        database.prepare(`SELECT COUNT(*) AS count FROM ${table} ${whereSql}`).get(params) as {
          count: number;
        }
      ).count;
      const rows = database
        .prepare(`SELECT * FROM ${table} ${whereSql} ${sortSql} LIMIT @limit OFFSET @offset`)
        .all(params) as Record<string, unknown>[];

      return { columns, rows, page, pageSize, totalRows };
    } finally {
      database.close();
    }
  }

  async executeQuery(
    connection: DbInspectorConnection,
    request: ExecuteQueryRequest,
    readOnlyMode: boolean
  ): Promise<QueryExecutionResult> {
    assertSingleStatement(request.sqlText);
    if (readOnlyMode && isMutatingSql(request.sqlText)) {
      throw new Error('Read-only mode rejected a mutating SQL statement.');
    }

    const database = openSqlite(connection);
    const startedAt = performance.now();
    try {
      const statement = database.prepare(request.sqlText);
      if (statement.reader) {
        const rows = statement.all() as Record<string, unknown>[];
        const maxRows = Math.max(request.maxRows ?? 500, 1);
        const limitedRows = rows.slice(0, maxRows);
        return {
          columns: Object.keys(limitedRows[0] ?? {}).map((name) => ({
            name,
            type: '',
            nullable: true
          })),
          rows: limitedRows,
          durationMs: Math.round(performance.now() - startedAt),
          truncated: rows.length > maxRows
        };
      }

      const result = statement.run();
      return {
        columns: [],
        rows: [],
        affectedRows: Number(result.changes),
        durationMs: Math.round(performance.now() - startedAt)
      };
    } finally {
      database.close();
    }
  }

  private loadColumns(database: Database.Database, tableName: string): DatabaseColumn[] {
    return columnsFromTableInfo(
      database
        .prepare(`PRAGMA table_info(${quoteIdentifier(tableName)})`)
        .all() as SqliteTableInfoRow[]
    );
  }

  private loadIndexes(database: Database.Database, tableName: string): DatabaseIndex[] {
    const indexes = database
      .prepare(`PRAGMA index_list(${quoteIdentifier(tableName)})`)
      .all() as SqliteIndexListRow[];
    return indexes
      .filter((row) => row.origin !== 'pk')
      .map((row) => ({
        name: row.name,
        unique: row.unique === 1,
        columns: (
          database
            .prepare(`PRAGMA index_info(${quoteIdentifier(row.name)})`)
            .all() as SqliteIndexInfoRow[]
        ).map((column) => column.name)
      }));
  }
}
