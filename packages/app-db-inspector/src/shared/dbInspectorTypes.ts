export type DbInspectorDriverType = 'sqlite' | 'postgresql' | 'mysql';

export interface DbInspectorSqliteConnection {
  driver: 'sqlite';
  databasePath: string;
  readOnly: boolean;
}

export interface DbInspectorPostgresConnection {
  driver: 'postgresql';
  host: string;
  port: number;
  database: string;
  username: string;
  passwordSecretId?: string;
  hasPassword: boolean;
  sslMode: 'disable' | 'prefer' | 'require';
}

export interface DbInspectorMysqlConnection {
  driver: 'mysql';
  host: string;
  port: number;
  database: string;
  username: string;
  passwordSecretId?: string;
  hasPassword: boolean;
  sslMode: 'disable' | 'require';
}

export type DbInspectorConnection =
  | DbInspectorSqliteConnection
  | DbInspectorPostgresConnection
  | DbInspectorMysqlConnection;

export interface DbInspectorWorkspace {
  id: string;
  name: string;
  driver: DbInspectorDriverType;
  connection: DbInspectorConnection;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSchemaSnapshot {
  schemas: DatabaseSchema[];
  refreshedAt: string;
}

export interface DatabaseSchema {
  name: string;
  tables: DatabaseTable[];
  views: DatabaseView[];
}

export interface DatabaseTable {
  schemaName?: string;
  name: string;
  columns: DatabaseColumn[];
  primaryKey: string[];
  foreignKeys: DatabaseForeignKey[];
  indexes: DatabaseIndex[];
}

export interface DatabaseView {
  schemaName?: string;
  name: string;
  columns: DatabaseColumn[];
}

export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  primaryKeyOrdinal?: number;
}

export interface DatabaseForeignKey {
  columns: string[];
  referencedSchemaName?: string;
  referencedTableName: string;
  referencedColumns: string[];
}

export interface DatabaseIndex {
  name: string;
  unique: boolean;
  columns: string[];
}

export interface LoadTablePageRequest {
  workspaceId: string;
  schemaName?: string;
  tableName: string;
  page: number;
  pageSize: number;
  sort?: {
    column: string;
    direction: 'asc' | 'desc';
  };
  whereClause?: string;
  filter?: string;
}

export interface TablePageResult {
  columns: DatabaseColumn[];
  rows: Record<string, unknown>[];
  page: number;
  pageSize: number;
  totalRows: number;
}

export interface ExecuteQueryRequest {
  workspaceId: string;
  sqlText: string;
  maxRows?: number;
}

export interface ExplainQueryRequest {
  workspaceId: string;
  sqlText: string;
}

export interface QueryExecutionResult {
  columns: DatabaseColumn[];
  rows: Record<string, unknown>[];
  affectedRows?: number;
  durationMs: number;
  truncated?: boolean;
}

export interface ExplainPlanNode {
  id: string;
  label: string;
  detail?: string;
  cost?: string;
  rows?: string;
  children?: ExplainPlanNode[];
}

export interface ExplainQueryResult {
  nodes: ExplainPlanNode[];
  rawText?: string;
  rawJson?: unknown;
  durationMs: number;
}

export interface QueryHistoryEntry {
  id: string;
  workspaceId: string;
  sqlText: string;
  startedAt: string;
  durationMs: number;
  rowCount: number;
  errorCode?: string;
  errorMessage?: string;
}

export interface QueryTab {
  id: string;
  workspaceId: string;
  title: string;
  sqlText: string;
  sortOrder: number;
  updatedAt: string;
}

export interface SaveQueryTabInput {
  id?: string;
  workspaceId: string;
  title: string;
  sqlText: string;
}
