import mysql, { type RowDataPacket } from 'mysql2/promise';
import type {
  DatabaseSchemaSnapshot,
  DbInspectorConnection,
  ExplainQueryRequest,
  ExplainQueryResult,
  ExecuteQueryRequest,
  LoadTablePageRequest,
  QueryExecutionResult,
  TablePageResult
} from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import { assertSingleStatement, isMutatingSql } from '@tnet/app-db-inspector/shared/sqlModel';
import type { DbInspectorSecretStore } from '../service/secretStore';
import type { DatabaseDriver } from './databaseDriver';
import { mysqlJsonPlanToNodes } from './explainPlanModel';
import { limitedQueryResult, tablePage } from './sqlDriverUtils';

export class MysqlDriver implements DatabaseDriver {
  constructor(private readonly secretStore: DbInspectorSecretStore) {}

  async testConnection(connection: DbInspectorConnection): Promise<void> {
    const client = await this.open(connection);
    await client.query('SELECT 1');
    await client.end();
  }

  async introspect(connection: DbInspectorConnection): Promise<DatabaseSchemaSnapshot> {
    const client = await this.open(connection);
    try {
      const [tables] = await client.query<Array<MysqlTableRow & RowDataPacket>>(
        `SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE
         FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE()
         ORDER BY TABLE_NAME`
      );
      const [columns] = await client.query<Array<MysqlColumnRow & RowDataPacket>>(
        `SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
         ORDER BY TABLE_NAME, ORDINAL_POSITION`
      );
      const [keyColumns] = await client.query<Array<MysqlKeyColumnRow & RowDataPacket>>(
        `SELECT
           TABLE_NAME,
           COLUMN_NAME,
           CONSTRAINT_NAME,
           REFERENCED_TABLE_SCHEMA,
           REFERENCED_TABLE_NAME,
           REFERENCED_COLUMN_NAME,
           ORDINAL_POSITION
         FROM information_schema.KEY_COLUMN_USAGE
         WHERE TABLE_SCHEMA = DATABASE()
         ORDER BY TABLE_NAME, CONSTRAINT_NAME, ORDINAL_POSITION`
      );
      const [indexes] = await client.query<Array<MysqlIndexRow & RowDataPacket>>(
        `SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE, COLUMN_NAME
         FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
         ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`
      );
      const schemaName = connection.driver === 'mysql' ? connection.database : 'main';
      return {
        refreshedAt: new Date().toISOString(),
        schemas: [
          {
            name: schemaName,
            tables: tables
              .filter((table) => table.TABLE_TYPE === 'BASE TABLE')
              .map((table) => ({
                schemaName,
                name: table.TABLE_NAME,
                columns: columns
                  .filter((column) => column.TABLE_NAME === table.TABLE_NAME)
                  .map((column) => ({
                    name: column.COLUMN_NAME,
                    type: column.DATA_TYPE,
                    nullable: column.IS_NULLABLE === 'YES',
                    primaryKeyOrdinal: keyColumns.find(
                      (keyColumn) =>
                        keyColumn.TABLE_NAME === table.TABLE_NAME &&
                        keyColumn.COLUMN_NAME === column.COLUMN_NAME &&
                        keyColumn.CONSTRAINT_NAME === 'PRIMARY'
                    )?.ORDINAL_POSITION
                  })),
                primaryKey: keyColumns
                  .filter(
                    (keyColumn) =>
                      keyColumn.TABLE_NAME === table.TABLE_NAME &&
                      keyColumn.CONSTRAINT_NAME === 'PRIMARY'
                  )
                  .map((keyColumn) => keyColumn.COLUMN_NAME),
                foreignKeys: groupMysqlForeignKeys(
                  keyColumns.filter(
                    (keyColumn) =>
                      keyColumn.TABLE_NAME === table.TABLE_NAME &&
                      Boolean(keyColumn.REFERENCED_TABLE_NAME)
                  )
                ),
                indexes: groupMysqlIndexes(
                  indexes.filter((index) => index.TABLE_NAME === table.TABLE_NAME)
                )
              })),
            views: []
          }
        ]
      };
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
      const table = mysqlQuote(request.tableName);
      const pageSize = Math.min(Math.max(Math.floor(request.pageSize), 1), 500);
      const page = Math.max(Math.floor(request.page), 0);
      const where = request.whereClause ? `WHERE ${request.whereClause}` : '';
      const order = request.sort
        ? `ORDER BY ${mysqlQuote(request.sort.column)} ${request.sort.direction === 'desc' ? 'DESC' : 'ASC'}`
        : '';
      const [rows] = await client.query<Array<Record<string, unknown> & RowDataPacket>>(
        `SELECT * FROM ${table} ${where} ${order} LIMIT ? OFFSET ?`,
        [pageSize, page * pageSize]
      );
      const [countRows] = await client.query<Array<{ count: number } & RowDataPacket>>(
        `SELECT COUNT(*) AS count FROM ${table} ${where}`
      );
      return tablePage(
        Object.keys(rows[0] ?? {}).map((name) => ({ name, type: '', nullable: true })),
        rows,
        page,
        pageSize,
        Number(countRows[0]?.count ?? 0)
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
      const [result] = await client.query(request.sqlText);
      const affectedRows =
        typeof result === 'object' && result && 'affectedRows' in result
          ? Number((result as { affectedRows?: number }).affectedRows ?? 0)
          : 0;
      return Array.isArray(result)
        ? limitedQueryResult(result as Record<string, unknown>[], startedAt, request.maxRows)
        : {
            columns: [],
            rows: [],
            affectedRows,
            durationMs: Math.round(performance.now() - startedAt)
          };
    } finally {
      await client.end();
    }
  }

  async explainQuery(
    connection: DbInspectorConnection,
    request: ExplainQueryRequest
  ): Promise<ExplainQueryResult> {
    assertSingleStatement(request.sqlText);
    if (isMutatingSql(request.sqlText)) {
      throw new Error('EXPLAIN is only available for read-only SQL statements.');
    }
    const client = await this.open(connection);
    const startedAt = performance.now();
    try {
      try {
        const [jsonRows] = await client.query<Array<{ EXPLAIN: string } & RowDataPacket>>(
          `EXPLAIN FORMAT=JSON ${request.sqlText}`
        );
        const rawJson = JSON.parse(jsonRows[0]?.EXPLAIN ?? '{}') as unknown;
        return {
          nodes: mysqlJsonPlanToNodes(rawJson),
          rawJson,
          durationMs: Math.round(performance.now() - startedAt)
        };
      } catch {
        const [rows] = await client.query<Array<Record<string, unknown> & RowDataPacket>>(
          `EXPLAIN ${request.sqlText}`
        );
        return {
          nodes: [],
          rawText: rows.map((row) => JSON.stringify(row)).join('\n'),
          durationMs: Math.round(performance.now() - startedAt)
        };
      }
    } finally {
      await client.end();
    }
  }

  private async open(connection: DbInspectorConnection): Promise<mysql.Connection> {
    if (connection.driver !== 'mysql') throw new Error('Invalid MySQL connection.');
    return mysql.createConnection({
      host: connection.host,
      port: connection.port,
      database: connection.database,
      user: connection.username,
      password: this.secretStore.resolveSecret(connection.passwordSecretId),
      ssl: connection.sslMode === 'require' ? {} : undefined
    });
  }
}

const mysqlQuote = (identifier: string): string => `\`${identifier.replace(/`/g, '``')}\``;

interface MysqlTableRow {
  TABLE_SCHEMA: string;
  TABLE_NAME: string;
  TABLE_TYPE: string;
}

interface MysqlColumnRow {
  TABLE_SCHEMA: string;
  TABLE_NAME: string;
  COLUMN_NAME: string;
  DATA_TYPE: string;
  IS_NULLABLE: string;
}

interface MysqlKeyColumnRow {
  TABLE_NAME: string;
  COLUMN_NAME: string;
  CONSTRAINT_NAME: string;
  REFERENCED_TABLE_SCHEMA: string | null;
  REFERENCED_TABLE_NAME: string | null;
  REFERENCED_COLUMN_NAME: string | null;
  ORDINAL_POSITION: number;
}

interface MysqlIndexRow {
  TABLE_NAME: string;
  INDEX_NAME: string;
  NON_UNIQUE: number;
  COLUMN_NAME: string;
}

const groupMysqlForeignKeys = (
  rows: Array<
    Pick<
      MysqlKeyColumnRow,
      | 'CONSTRAINT_NAME'
      | 'COLUMN_NAME'
      | 'REFERENCED_TABLE_SCHEMA'
      | 'REFERENCED_TABLE_NAME'
      | 'REFERENCED_COLUMN_NAME'
    >
  >
) =>
  [...new Set(rows.map((row) => row.CONSTRAINT_NAME))].map((constraintName) => {
    const constraintRows = rows.filter((row) => row.CONSTRAINT_NAME === constraintName);
    return {
      columns: constraintRows.map((row) => row.COLUMN_NAME),
      referencedSchemaName: constraintRows[0]?.REFERENCED_TABLE_SCHEMA ?? undefined,
      referencedTableName: constraintRows[0]?.REFERENCED_TABLE_NAME ?? '',
      referencedColumns: constraintRows.map((row) => row.REFERENCED_COLUMN_NAME ?? '')
    };
  });

const groupMysqlIndexes = (
  rows: Array<Pick<MysqlIndexRow, 'INDEX_NAME' | 'NON_UNIQUE' | 'COLUMN_NAME'>>
) =>
  [...new Set(rows.map((row) => row.INDEX_NAME))].map((indexName) => {
    const indexRows = rows.filter((row) => row.INDEX_NAME === indexName);
    return {
      name: indexName,
      unique: indexRows[0]?.NON_UNIQUE === 0,
      columns: indexRows.map((row) => row.COLUMN_NAME)
    };
  });
