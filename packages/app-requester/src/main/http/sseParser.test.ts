// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { parseSseChunk } from './sseParser';

describe('parseSseChunk', () => {
  it('parses event, id, retry, and multiline data', () => {
    expect(
      parseSseChunk('id: 1\nevent: update\nretry: 1000\ndata: hello\ndata: world\n\n')
    ).toEqual([
      {
        id: '1',
        event: 'update',
        retry: 1000,
        data: 'hello\nworld'
      }
    ]);
  });

  it('uses message as the default event and ignores comments', () => {
    expect(parseSseChunk(': comment\ndata: ok\n\n')).toEqual([
      {
        event: 'message',
        data: 'ok'
      }
    ]);
  });
});
