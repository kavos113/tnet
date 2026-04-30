import type { SaveRequesterRequestInput } from '@tnet/app-requester/shared/requesterTypes';
import { serializeRequesterRequest } from '../http/requestSerializer';

const introspectionQuery = `
query IntrospectionQuery {
  __schema {
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types {
      kind
      name
      fields {
        name
        args { name type { kind name ofType { kind name } } }
        type { kind name ofType { kind name } }
      }
    }
  }
}
`;

export interface GraphqlSchemaStore {
  save(input: { workspaceId: string; endpointUrl: string; schemaJson: string }): {
    schemaJson: string;
    fetchedAt: string;
  };
}

export class GraphqlIntrospectionService {
  constructor(
    private readonly schemaStore: GraphqlSchemaStore,
    private readonly transport: { fetch(url: string, init: RequestInit): Promise<Response> } = {
      fetch: (url, init) => fetch(url, init)
    }
  ) {}

  async introspect(input: {
    workspaceId: string;
    endpointUrl: string;
    headers?: SaveRequesterRequestInput['headers'];
    auth?: Pick<
      SaveRequesterRequestInput,
      | 'authType'
      | 'authUsername'
      | 'authPassword'
      | 'authToken'
      | 'authApiKeyName'
      | 'authApiKeyValue'
    >;
  }): Promise<{ schemaJson: string; fetchedAt: string }> {
    const serialized = await serializeRequesterRequest({
      workspaceId: input.workspaceId,
      name: 'GraphQL Introspection',
      method: 'POST',
      url: input.endpointUrl,
      headers: input.headers,
      bodyMode: 'graphql',
      bodyText: introspectionQuery,
      ...(input.auth ?? {})
    });
    const response = await this.transport.fetch(serialized.url, serialized.init);
    if (!response.ok) throw new Error(`GraphQL introspection failed: ${response.status}`);
    const schemaJson = await response.text();
    return this.schemaStore.save({
      workspaceId: input.workspaceId,
      endpointUrl: input.endpointUrl,
      schemaJson
    });
  }
}
