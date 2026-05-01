import { describe, expect, it } from 'vitest';
import { interpolateRequesterRequest, interpolateText } from './variableInterpolation';

const variables = [
  { key: 'baseUrl', value: 'https://api.example.test', updatedAt: '2026-05-01T00:00:00.000Z' },
  { key: 'token', value: 'abc', updatedAt: '2026-05-01T00:00:00.000Z' },
  { key: 'user.id', value: '42', updatedAt: '2026-05-01T00:00:00.000Z' }
];

describe('variableInterpolation', () => {
  it('interpolates known variables and keeps unknown placeholders', () => {
    expect(interpolateText('{{baseUrl}}/users/{{ user.id }}/{{missing}}', variables)).toBe(
      'https://api.example.test/users/42/{{missing}}'
    );
  });

  it('interpolates request URL, rows, body, and auth fields', () => {
    const interpolated = interpolateRequesterRequest(
      {
        workspaceId: 'workspace-1',
        name: 'Read User',
        method: 'GET',
        url: '{{baseUrl}}/users/{{user.id}}',
        headers: [{ id: 'auth', enabled: true, key: 'Authorization', value: 'Bearer {{token}}' }],
        queryParams: [{ id: 'include', enabled: true, key: 'include', value: '{{missing}}' }],
        bodyText: '{"id":"{{user.id}}"}',
        authToken: '{{token}}'
      },
      variables
    );

    expect(interpolated).toMatchObject({
      url: 'https://api.example.test/users/42',
      bodyText: '{"id":"42"}',
      authToken: 'abc',
      headers: [expect.objectContaining({ value: 'Bearer abc' })],
      queryParams: [expect.objectContaining({ value: '{{missing}}' })]
    });
  });
});
