import { describe, expect, it } from 'vitest';
import { withQueryTimeout } from './queryTimeout';

describe('withQueryTimeout', () => {
  interface ResolveTestCase {
    name: string;
    promise: Promise<string>;
    timeoutMs: number;
    expected: string;
  }

  interface RejectTestCase {
    name: string;
    promise: Promise<string>;
    timeoutMs: number;
    expectedError: string;
  }

  const resolveCases: ResolveTestCase[] = [
    {
      name: 'resolves when the query finishes before the timeout',
      promise: Promise.resolve('done'),
      timeoutMs: 50,
      expected: 'done'
    }
  ];
  const rejectCases: RejectTestCase[] = [
    {
      name: 'rejects when the query exceeds the timeout',
      promise: new Promise((resolve) => setTimeout(() => resolve('late'), 30)),
      timeoutMs: 1,
      expectedError: 'Query timed out after 1 ms.'
    }
  ];

  resolveCases.forEach((testCase) => {
    it(testCase.name, async () => {
      await expect(withQueryTimeout(testCase.promise, testCase.timeoutMs)).resolves.toBe(
        testCase.expected
      );
    });
  });

  rejectCases.forEach((testCase) => {
    it(testCase.name, async () => {
      await expect(withQueryTimeout(testCase.promise, testCase.timeoutMs)).rejects.toThrow(
        testCase.expectedError
      );
    });
  });
});
