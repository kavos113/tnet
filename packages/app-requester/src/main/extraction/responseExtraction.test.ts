// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { RequesterResponseSnapshot } from '@tnet/app-requester/shared/requesterTypes';
import { extractVariablesFromResponse } from './responseExtraction';

const response = (bodyText: string): RequesterResponseSnapshot => ({
  status: 200,
  statusText: 'OK',
  headers: [
    {
      id: 'content-type',
      enabled: true,
      key: 'content-type',
      value: 'application/json'
    },
    {
      id: 'request-id',
      enabled: true,
      key: 'x-request-id',
      value: 'req-1'
    }
  ],
  bodyText,
  bodyBase64: '',
  contentType: 'application/json',
  byteSize: bodyText.length,
  durationMs: 10,
  isBodyTruncated: false,
  previewType: 'json'
});

describe('extractVariablesFromResponse', () => {
  it('extracts JSONPath and header values into variables', () => {
    const extracted = extractVariablesFromResponse(
      [
        {
          id: 'json',
          enabled: true,
          source: 'json-body',
          expression: '$.user.tokens[0]',
          targetVariable: 'accessToken'
        },
        {
          id: 'header',
          enabled: true,
          source: 'header',
          expression: 'X-Request-Id',
          targetVariable: 'requestId'
        }
      ],
      response('{"user":{"tokens":["abc"]}}')
    );

    expect(extracted).toEqual([
      { key: 'accessToken', value: 'abc' },
      { key: 'requestId', value: 'req-1' }
    ]);
  });

  it('ignores disabled, invalid, or missing extraction rules', () => {
    const extracted = extractVariablesFromResponse(
      [
        {
          id: 'disabled',
          enabled: false,
          source: 'json-body',
          expression: '$.ok',
          targetVariable: 'ok'
        },
        {
          id: 'missing',
          enabled: true,
          source: 'json-body',
          expression: '$.missing',
          targetVariable: 'missing'
        },
        {
          id: 'invalid',
          enabled: true,
          source: 'json-body',
          expression: '$["unsupported"]',
          targetVariable: 'invalid'
        }
      ],
      response('{"ok":true}')
    );

    expect(extracted).toEqual([]);
  });
});
