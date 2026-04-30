// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { redactRequesterRequest } from './redaction';

describe('redactRequesterRequest', () => {
  it('redacts auth secrets and sensitive headers', () => {
    expect(
      redactRequesterRequest({
        workspaceId: 'workspace-1',
        name: 'Secret',
        method: 'GET',
        url: 'https://example.test',
        authPassword: 'password',
        authToken: 'token',
        authApiKeyValue: 'key',
        headers: [
          { id: '1', enabled: true, key: 'Authorization', value: 'Bearer token' },
          { id: '2', enabled: true, key: 'X-Trace', value: 'trace' }
        ]
      })
    ).toMatchObject({
      authPassword: '********',
      authToken: '********',
      authApiKeyValue: '********',
      headers: [
        { key: 'Authorization', value: '********' },
        { key: 'X-Trace', value: 'trace' }
      ]
    });
  });
});
