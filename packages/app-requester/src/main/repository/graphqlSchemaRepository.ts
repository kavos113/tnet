import { createHash, randomUUID } from 'node:crypto';
import type { RequesterGraphqlSchemaCache } from '@tnet/app-requester/shared/requesterTypes';
import type { RequesterDatabase } from './requesterDb';

interface GraphqlSchemaRow {
  id: string;
  workspace_id: string;
  endpoint_hash: string;
  schema_json: string;
  fetched_at: string;
}

export const hashGraphqlEndpoint = (endpointUrl: string): string =>
  createHash('sha256').update(endpointUrl).digest('hex');

const toCache = (row: GraphqlSchemaRow): RequesterGraphqlSchemaCache => ({
  id: row.id,
  workspaceId: row.workspace_id,
  endpointHash: row.endpoint_hash,
  schemaJson: row.schema_json,
  fetchedAt: row.fetched_at
});

export class GraphqlSchemaRepository {
  constructor(private readonly database: RequesterDatabase) {}

  get(workspaceId: string, endpointUrl: string): RequesterGraphqlSchemaCache | null {
    const row = this.database
      .prepare(
        `SELECT id, workspace_id, endpoint_hash, schema_json, fetched_at
         FROM graphql_schemas
         WHERE workspace_id = ? AND endpoint_hash = ?
         ORDER BY fetched_at DESC
         LIMIT 1`
      )
      .get(workspaceId, hashGraphqlEndpoint(endpointUrl)) as GraphqlSchemaRow | undefined;
    return row ? toCache(row) : null;
  }

  save(input: {
    workspaceId: string;
    endpointUrl: string;
    schemaJson: string;
  }): RequesterGraphqlSchemaCache {
    const existing = this.get(input.workspaceId, input.endpointUrl);
    const fetchedAt = new Date().toISOString();
    const endpointHash = hashGraphqlEndpoint(input.endpointUrl);
    const id = existing?.id ?? randomUUID();
    this.database
      .prepare(
        `INSERT INTO graphql_schemas (id, workspace_id, endpoint_hash, schema_json, fetched_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET schema_json = excluded.schema_json, fetched_at = excluded.fetched_at`
      )
      .run(id, input.workspaceId, endpointHash, input.schemaJson, fetchedAt);

    return {
      id,
      workspaceId: input.workspaceId,
      endpointHash,
      schemaJson: input.schemaJson,
      fetchedAt
    };
  }
}
