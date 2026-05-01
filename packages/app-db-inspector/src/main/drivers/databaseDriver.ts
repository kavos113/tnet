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

export interface DatabaseDriver {
  testConnection(connection: DbInspectorConnection): Promise<void>;
  introspect(connection: DbInspectorConnection): Promise<DatabaseSchemaSnapshot>;
  loadTablePage(
    connection: DbInspectorConnection,
    request: LoadTablePageRequest
  ): Promise<TablePageResult>;
  executeQuery(
    connection: DbInspectorConnection,
    request: ExecuteQueryRequest,
    readOnlyMode: boolean
  ): Promise<QueryExecutionResult>;
  explainQuery(
    connection: DbInspectorConnection,
    request: ExplainQueryRequest
  ): Promise<ExplainQueryResult>;
}
