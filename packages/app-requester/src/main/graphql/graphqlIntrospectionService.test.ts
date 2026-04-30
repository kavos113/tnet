// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import {
  GraphqlIntrospectionService,
  type GraphqlSchemaStore
} from './graphqlIntrospectionService';

describe('GraphqlIntrospectionService', () => {
  it('sends an introspection query and stores the schema response', async () => {
    const schemaStore: GraphqlSchemaStore = {
      save: vi.fn().mockImplementation((input: { schemaJson: string }) => ({
        schemaJson: input.schemaJson,
        fetchedAt: '2026-05-01T00:00:00.000Z'
      }))
    };
    const transport = {
      fetch: vi.fn().mockResolvedValue(
        new Response('{"data":{"__schema":{"queryType":{"name":"Query"}}}}', {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      )
    };

    await expect(
      new GraphqlIntrospectionService(schemaStore, transport).introspect({
        workspaceId: 'workspace-1',
        endpointUrl: 'https://example.test/graphql',
        auth: { authType: 'bearer', authToken: 'token' }
      })
    ).resolves.toEqual({
      schemaJson: '{"data":{"__schema":{"queryType":{"name":"Query"}}}}',
      fetchedAt: '2026-05-01T00:00:00.000Z'
    });
    expect(transport.fetch).toHaveBeenCalledOnce();
    expect(schemaStore.save).toHaveBeenCalledWith({
      workspaceId: 'workspace-1',
      endpointUrl: 'https://example.test/graphql',
      schemaJson: '{"data":{"__schema":{"queryType":{"name":"Query"}}}}'
    });
  });
});
