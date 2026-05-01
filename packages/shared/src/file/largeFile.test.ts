import { describe, expect, it } from 'vitest';
import {
  isLargeMarkdownContent,
  largeMarkdownFileThresholdBytes,
  textByteLength
} from './largeFile';

describe('largeFile', () => {
  it('measures UTF-8 byte length', () => {
    expect(textByteLength('abc')).toBe(3);
    expect(textByteLength('あ')).toBe(3);
  });

  it('detects content at or above the large markdown threshold', () => {
    expect(isLargeMarkdownContent('x'.repeat(largeMarkdownFileThresholdBytes - 1))).toBe(false);
    expect(isLargeMarkdownContent('x'.repeat(largeMarkdownFileThresholdBytes))).toBe(true);
  });
});
