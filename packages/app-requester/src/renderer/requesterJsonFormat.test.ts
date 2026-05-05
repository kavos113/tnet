import { describe, expect, it } from 'vitest';
import { formatJsonText } from './requesterJsonFormat';

describe('formatJsonText', () => {
  it('formats valid JSON with two-space indentation', () => {
    const cases: Array<{ input: string; expected: string }> = [
      { input: '{"ok":true}', expected: '{\n  "ok": true\n}' },
      {
        input: '[{"id":1},{"id":2}]',
        expected: '[\n  {\n    "id": 1\n  },\n  {\n    "id": 2\n  }\n]'
      }
    ];

    for (const testCase of cases) {
      expect(formatJsonText(testCase.input)).toEqual({ ok: true, value: testCase.expected });
    }
  });

  it('returns a failure for invalid JSON', () => {
    const cases = ['{"ok":}', ''];

    for (const testCase of cases) {
      expect(formatJsonText(testCase)).toMatchObject({ ok: false });
    }
  });
});
