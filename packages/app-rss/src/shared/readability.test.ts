import { describe, expect, it } from 'vitest';
import { extractReadableText } from './readability';

describe('extractReadableText', () => {
  it('extracts readable text from simple HTML', () => {
    expect(extractReadableText('<article><h1>Hello</h1><p>World</p></article>')).toBe(
      'Hello World'
    );
  });
});
