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
import type { WorkspaceRepository } from '../repository/workspaceRepository';
import type { SchemaCacheRepository } from '../repository/schemaCacheRepository';
import type { QueryHistoryRepository } from '../repository/queryHistoryRepository';
import type { DbInspectorSecretStore } from './secretStore';
import type { DatabaseDriver } from '../drivers/databaseDriver';
import { SqliteDriver } from '../drivers/sqliteDriver';
import { PostgresDriver } from '../drivers/postgresDriver';
import { MysqlDriver } from '../drivers/mysqlDriver';
import { withQueryTimeout } from '../../shared/queryTimeout';
import { normalizeDbInspectorError } from './dbInspectorErrors';

export class DbInspectorService {
  private readonly sqliteDriver = new SqliteDriver();
  private readonly postgresDriver: PostgresDriver;
  private readonly mysqlDriver: MysqlDriver;

  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly schemaCacheRepository: SchemaCacheRepository,
    private readonly queryHistoryRepository: QueryHistoryRepository,
    secretStore: DbInspectorSecretStore
  ) {
    this.postgresDriver = new PostgresDriver(secretStore);
    this.mysqlDriver = new MysqlDriver(secretStore);
  }

  async testConnection(workspaceId: string): Promise<void> {
    const workspace = this.getWorkspaceOrThrow(workspaceId);
    try {
      await this.driverFor(workspace.connection).testConnection(workspace.connection);
    } catch (error) {
      throw normalizeDbInspectorError(error);
    }
  }

  async refreshSchema(workspaceId: string): Promise<DatabaseSchemaSnapshot> {
    const workspace = this.getWorkspaceOrThrow(workspaceId);
    const snapshot = await this.driverFor(workspace.connection)
      .introspect(workspace.connection)
      .catch((error) => {
        throw normalizeDbInspectorError(error);
      });
    this.schemaCacheRepository.save(workspaceId, snapshot);
    return snapshot;
  }

  getSchema(workspaceId: string): DatabaseSchemaSnapshot | null {
    return this.schemaCacheRepository.get(workspaceId);
  }

  async loadTablePage(request: LoadTablePageRequest): Promise<TablePageResult> {
    const workspace = this.getWorkspaceOrThrow(request.workspaceId);
    return this.driverFor(workspace.connection).loadTablePage(workspace.connection, request);
  }

  async executeQuery(request: ExecuteQueryRequest): Promise<QueryExecutionResult> {
    const workspace = this.getWorkspaceOrThrow(request.workspaceId);
    const settings = this.workspaceRepository.getSettings(request.workspaceId);
    const startedAt = new Date().toISOString();
    try {
      const result = await withQueryTimeout(
        this.driverFor(workspace.connection).executeQuery(
          workspace.connection,
          request,
          settings.readOnlyMode
        ),
        settings.queryTimeoutMs
      );
      this.queryHistoryRepository.save({
        workspaceId: request.workspaceId,
        sqlText: request.sqlText,
        startedAt,
        durationMs: result.durationMs,
        rowCount: result.rows.length
      });
      return result;
    } catch (error) {
      this.queryHistoryRepository.save({
        workspaceId: request.workspaceId,
        sqlText: request.sqlText,
        startedAt,
        durationMs: 0,
        rowCount: 0,
        errorCode: 'query_failed',
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      throw normalizeDbInspectorError(error);
    }
  }

  async explainQuery(request: ExplainQueryRequest): Promise<ExplainQueryResult> {
    const workspace = this.getWorkspaceOrThrow(request.workspaceId);
    const settings = this.workspaceRepository.getSettings(request.workspaceId);
    try {
      return await withQueryTimeout(
        this.driverFor(workspace.connection).explainQuery(workspace.connection, request),
        settings.queryTimeoutMs
      );
    } catch (error) {
      throw normalizeDbInspectorError(error);
    }
  }

  private getWorkspaceOrThrow(workspaceId: string) {
    const workspace = this.workspaceRepository.get(workspaceId);
    if (!workspace) throw new Error(`Workspace not found: ${workspaceId}`);
    return workspace;
  }

  private driverFor(connection: DbInspectorConnection): DatabaseDriver {
    if (connection.driver === 'postgresql') return this.postgresDriver;
    if (connection.driver === 'mysql') return this.mysqlDriver;
    return this.sqliteDriver;
  }
}
