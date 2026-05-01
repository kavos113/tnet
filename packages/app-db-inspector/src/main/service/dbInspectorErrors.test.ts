import { describe, expect, it } from 'vitest';
import { normalizeDbInspectorError } from './dbInspectorErrors';

describe('normalizeDbInspectorError', () => {
  interface TestCase {
    name: string;
    error: Error & { code?: string };
    expected: string;
  }

  const cases: TestCase[] = [
    {
      name: 'maps PostgreSQL auth failure',
      error: Object.assign(new Error('password authentication failed for user'), { code: '28P01' }),
      expected: 'Authentication failed.'
    },
    {
      name: 'maps MySQL auth failure',
      error: Object.assign(new Error('Access denied for user'), {
        code: 'ER_ACCESS_DENIED_ERROR'
      }),
      expected: 'Authentication failed.'
    },
    {
      name: 'maps connection refusal',
      error: Object.assign(new Error('connect ECONNREFUSED 127.0.0.1'), {
        code: 'ECONNREFUSED'
      }),
      expected: 'Connection failed.'
    }
  ];

  cases.forEach((testCase) => {
    it(testCase.name, () => {
      expect(normalizeDbInspectorError(testCase.error).message).toContain(testCase.expected);
    });
  });
});
