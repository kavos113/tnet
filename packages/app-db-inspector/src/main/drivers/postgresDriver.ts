import { Client } from 'pg';
import type {
  DatabaseSchemaSnapshot,
  DbInspectorConnection,
  ExecuteQueryRequest,
  LoadTablePageRequest,
  QueryExecutionResult,
  TablePageResult
} from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import { assertSingleStatement, isMutatingSql } from '@tnet/app-db-inspector/shared/sqlModel';
import type { DbInspectorSecretStore } from '../service/secretStore';
import type { DatabaseDriver } from './databaseDriver';
import { limitedQueryResult, tablePage } from './sqlDriverUtils';

export class PostgresDriver implements DatabaseDriver {
  constructor(private readonly secretStore: DbInspectorSecretStore) {}

  async testConnection(connection: DbInspectorConnection): Promise<void> {
    const client = await this.open(connection);
    await client.query('SELECT 1');
    await client.end();
  }

  async introspect(connection: DbInspectorConnection): Promise<DatabaseSchemaSnapshot> {
    const client = await this.open(connection);
    try {
      const tables = await client.query<{
        table_schema: string;
        table_name: string;
        table_type: string;
      }>(
        `SELECT table_schema, table_name, table_type
         FROM information_schema.tables
         WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
         ORDER BY table_schema, table_name`
      );
      const columns = await client.query<{
        table_schema: string;
        table_name: string;
        column_name: string;
        data_type: string;
        is_nullable: string;
      }>(
        `SELECT table_schema, table_name, column_name, data_type, is_nullable
         FROM information_schema.columns
         WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
         ORDER BY table_schema, table_name, ordinal_position`
      );
      const primaryKeys = await client.query<{
        table_schema: string;
        table_name: string;
        column_name: string;
        ordinal_position: number;
      }>(
        `SELECT
           tc.table_schema,
           tc.table_name,
           kcu.column_name,
           kcu.ordinal_position
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
         WHERE tc.constraint_type = 'PRIMARY KEY'
         ORDER BY tc.table_schema, tc.table_name, kcu.ordinal_position`
      );
      const foreignKeys = await client.query<{
        table_schema: string;
        table_name: string;
        column_name: string;
        foreign_table_schema: string;
        foreign_table_name: string;
        foreign_column_name: string;
        ordinal_position: number;
        constraint_name: string;
      }>(
        `SELECT
           tc.table_schema,
           tc.table_name,
           kcu.column_name,
           ccu.table_schema AS foreign_table_schema,
           ccu.table_name AS foreign_table_name,
           ccu.column_name AS foreign_column_name,
           kcu.ordinal_position,
           tc.constraint_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
         JOIN information_schema.constraint_column_usage ccu
           ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
         WHERE tc.constraint_type = 'FOREIGN KEY'
         ORDER BY tc.table_schema, tc.table_name, tc.constraint_name, kcu.ordinal_position`
      );
      const indexes = await client.query<{
        table_schema: string;
        table_name: string;
        index_name: string;
        indisunique: boolean;
        columns: string[];
      }>(
        `SELECT
           ns.nspname AS table_schema,
           tbl.relname AS table_name,
           idx.relname AS index_name,
           i.indisunique,
           array_agg(att.attname ORDER BY ord.ordinality) AS columns
         FROM pg_index i
         JOIN pg_class tbl ON tbl.oid = i.indrelid
         JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
         JOIN pg_class idx ON idx.oid = i.indexrelid
         JOIN unnest(i.indkey) WITH ORDINALITY AS ord(attnum, ordinality) ON true
         JOIN pg_attribute att ON att.attrelid = tbl.oid AND att.attnum = ord.attnum
         WHERE ns.nspname NOT IN ('pg_catalog', 'information_schema')
         GROUP BY ns.nspname, tbl.relname, idx.relname, i.indisunique
         ORDER BY ns.nspname, tbl.relname, idx.relname`
      );
      const schemas = [...new Set(tables.rows.map((row) => row.table_schema))].map((schema) => ({
        name: schema,
        tables: tables.rows
          .filter((table) => table.table_schema === schema && table.table_type === 'BASE TABLE')
          .map((table) => ({
            schemaName: schema,
            name: table.table_name,
            columns: columns.rows
              .filter(
                (column) => column.table_schema === schema && column.table_name === table.table_name
              )
              .map((column) => ({
                name: column.column_name,
                type: column.data_type,
                nullable: column.is_nullable === 'YES',
                primaryKeyOrdinal: primaryKeys.rows.find(
                  (primaryKey) =>
                    primaryKey.table_schema === schema &&
                    primaryKey.table_name === table.table_name &&
                    primaryKey.column_name === column.column_name
                )?.ordinal_position
              })),
            primaryKey: primaryKeys.rows
              .filter(
                (primaryKey) =>
                  primaryKey.table_schema === schema && primaryKey.table_name === table.table_name
              )
              .map((primaryKey) => primaryKey.column_name),
            foreignKeys: groupPostgresForeignKeys(
              foreignKeys.rows.filter(
                (foreignKey) =>
                  foreignKey.table_schema === schema && foreignKey.table_name === table.table_name
              )
            ),
            indexes: indexes.rows
              .filter(
                (index) => index.table_schema === schema && index.table_name === table.table_name
              )
              .map((index) => ({
                name: index.index_name,
                unique: index.indisunique,
                columns: index.columns
              }))
          })),
        views: []
      }));
      return { refreshedAt: new Date().toISOString(), schemas };
    } finally {
      await client.end();
    }
  }

  async loadTablePage(
    connection: DbInspectorConnection,
    request: LoadTablePageRequest
  ): Promise<TablePageResult> {
    const client = await this.open(connection);
    try {
      const table = pgTableRef(request.schemaName, request.tableName);
      const pageSize = Math.min(Math.max(Math.floor(request.pageSize), 1), 500);
      const page = Math.max(Math.floor(request.page), 0);
      const where = request.whereClause ? `WHERE ${request.whereClause}` : '';
      const order = request.sort
        ? `ORDER BY ${pgQuote(request.sort.column)} ${request.sort.direction === 'desc' ? 'DESC' : 'ASC'}`
        : '';
      const rows = await client.query<Record<string, unknown>>(
        `SELECT * FROM ${table} ${where} ${order} LIMIT $1 OFFSET $2`,
        [pageSize, page * pageSize]
      );
      const count = await client.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM ${table} ${where}`
      );
      return tablePage(
        Object.keys(rows.rows[0] ?? {}).map((name) => ({ name, type: '', nullable: true })),
        rows.rows,
        page,
        pageSize,
        Number(count.rows[0]?.count ?? 0)
      );
    } finally {
      await client.end();
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
    const client = await this.open(connection);
    const startedAt = performance.now();
    try {
      const result = await client.query<Record<string, unknown>>(request.sqlText);
      return result.command === 'SELECT'
        ? limitedQueryResult(result.rows, startedAt, request.maxRows)
        : {
            columns: [],
            rows: [],
            affectedRows: result.rowCount ?? 0,
            durationMs: Math.round(performance.now() - startedAt)
          };
    } finally {
      await client.end();
    }
  }

  private async open(connection: DbInspectorConnection): Promise<Client> {
    if (connection.driver !== 'postgresql') throw new Error('Invalid PostgreSQL connection.');
    const client = new Client({
      host: connection.host,
      port: connection.port,
      database: connection.database,
      user: connection.username,
      password: this.secretStore.resolveSecret(connection.passwordSecretId),
      ssl: connection.sslMode === 'require' ? { rejectUnauthorized: false } : false
    });
    await client.connect();
    return client;
  }
}

const pgQuote = (identifier: string): string => `"${identifier.replace(/"/g, '""')}"`;
const pgTableRef = (schemaName: string | undefined, tableName: string): string =>
  schemaName ? `${pgQuote(schemaName)}.${pgQuote(tableName)}` : pgQuote(tableName);

const groupPostgresForeignKeys = (
  rows: Array<{
    constraint_name: string;
    column_name: string;
    foreign_table_schema: string;
    foreign_table_name: string;
    foreign_column_name: string;
  }>
) =>
  [...new Set(rows.map((row) => row.constraint_name))].map((constraintName) => {
    const constraintRows = rows.filter((row) => row.constraint_name === constraintName);
    return {
      columns: constraintRows.map((row) => row.column_name),
      referencedSchemaName: constraintRows[0]?.foreign_table_schema,
      referencedTableName: constraintRows[0]?.foreign_table_name ?? '',
      referencedColumns: constraintRows.map((row) => row.foreign_column_name)
    };
  });
