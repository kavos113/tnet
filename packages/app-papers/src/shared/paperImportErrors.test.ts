import { describe, expect, it } from 'vitest';
import { formatPaperImportError } from './paperImportErrors';

describe('formatPaperImportError', () => {
  interface TestCase {
    name: string;
    error: unknown;
    expected: string;
  }

  const testCases: TestCase[] = [
    {
      name: 'formats Connect invalid argument required field errors',
      error: new Error('[invalid_argument] title is required'),
      expected: 'Title is required.'
    },
    {
      name: 'formats gRPC invalid argument required field errors',
      error: new Error('3 INVALID_ARGUMENT: source path is required'),
      expected: 'PDF file is required.'
    },
    {
      name: 'formats relative path validation errors',
      error: new Error('relative path must stay inside the library'),
      expected: 'Destination directory must stay inside the paper library.'
    },
    {
      name: 'falls back to a generic import error',
      error: undefined,
      expected: 'Failed to import paper.'
    }
  ];

  for (const testCase of testCases) {
    it(testCase.name, () => {
      expect(formatPaperImportError(testCase.error)).toBe(testCase.expected);
    });
  }
});
