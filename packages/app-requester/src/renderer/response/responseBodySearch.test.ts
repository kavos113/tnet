import { describe, expect, it } from 'vitest';
import { getTextSearchMatchRanges } from './responseBodySearch';

describe('getTextSearchMatchRanges', () => {
  it('finds case-insensitive non-overlapping matches', () => {
    const cases: Array<{
      text: string;
      query: string;
      expected: Array<{ start: number; end: number }>;
    }> = [
      {
        text: 'Ada ada ADA',
        query: 'ada',
        expected: [
          { start: 0, end: 3 },
          { start: 4, end: 7 },
          { start: 8, end: 11 }
        ]
      },
      {
        text: 'aaaa',
        query: 'aa',
        expected: [
          { start: 0, end: 2 },
          { start: 2, end: 4 }
        ]
      },
      { text: 'response', query: '', expected: [] },
      { text: 'response', query: 'missing', expected: [] }
    ];

    for (const testCase of cases) {
      expect(getTextSearchMatchRanges(testCase.text, testCase.query)).toEqual(testCase.expected);
    }
  });
});
