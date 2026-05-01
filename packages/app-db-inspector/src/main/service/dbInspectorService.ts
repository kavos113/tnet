import type {
  DatabaseSchemaSnapshot,
  ExecuteQueryRequest,
  LoadTablePageRequest,
  QueryExecutionResult,
  TablePageResult
} from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import type { WorkspaceRepository } from '../repository/workspaceRepository';
import type { SchemaCacheRepository } from '../repository/schemaCacheRepository';
import type { QueryHistoryRepository } from '../repository/queryHistoryRepository';
import { SqliteDriver } from '../drivers/sqliteDriver';

export class DbInspectorService {
  private readonly sqliteDriver = new SqliteDriver();

  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly schemaCacheRepository: SchemaCacheRepository,
    private readonly queryHistoryRepository: QueryHistoryRepository
  ) {}

  async testConnection(workspaceId: string): Promise<void> {
    const workspace = this.getWorkspaceOrThrow(workspaceId);
    await this.sqliteDriver.testConnection(workspace.connection);
  }

  async refreshSchema(workspaceId: string): Promise<DatabaseSchemaSnapshot> {
    const workspace = this.getWorkspaceOrThrow(workspaceId);
    const snapshot = await this.sqliteDriver.introspect(workspace.connection);
    this.schemaCacheRepository.save(workspaceId, snapshot);
    return snapshot;
  }

  getSchema(workspaceId: string): DatabaseSchemaSnapshot | null {
    return this.schemaCacheRepository.get(workspaceId);
  }

  async loadTablePage(request: LoadTablePageRequest): Promise<TablePageResult> {
    const workspace = this.getWorkspaceOrThrow(request.workspaceId);
    return this.sqliteDriver.loadTablePage(workspace.connection, request);
  }

  async executeQuery(request: ExecuteQueryRequest): Promise<QueryExecutionResult> {
    const workspace = this.getWorkspaceOrThrow(request.workspaceId);
    const settings = this.workspaceRepository.getSettings(request.workspaceId);
    const startedAt = new Date().toISOString();
    try {
      const result = await this.sqliteDriver.executeQuery(
        workspace.connection,
        request,
        settings.readOnlyMode
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
      throw error;
    }
  }

  private getWorkspaceOrThrow(workspaceId: string) {
    const workspace = this.workspaceRepository.get(workspaceId);
    if (!workspace) throw new Error(`Workspace not found: ${workspaceId}`);
    return workspace;
  }
}
