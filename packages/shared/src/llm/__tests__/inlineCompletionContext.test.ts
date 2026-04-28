import { describe, expect, it } from 'vitest';
import { buildInlineCompletionContext } from '../inlineCompletionContext';

describe('buildInlineCompletionContext', () => {
  it('collects prefix and suffix around the cursor', () => {
    expect(
      buildInlineCompletionContext({
        documentText: 'abcdef',
        cursorOffset: 3,
        trigger: 'automatic'
      })
    ).toMatchObject({
      prefix: 'abc',
      suffix: 'def',
      selectedText: '',
      cursorOffset: 3
    });
  });

  it('trims prefix and suffix to configured limits', () => {
    expect(
      buildInlineCompletionContext({
        documentText: '0123456789',
        cursorOffset: 5,
        trigger: 'manual',
        maxPrefixChars: 2,
        maxSuffixChars: 3
      })
    ).toMatchObject({
      prefix: '34',
      suffix: '567',
      trigger: 'manual'
    });
  });

  it('includes selected text independently of prefix and suffix', () => {
    expect(
      buildInlineCompletionContext({
        documentText: 'before selected after',
        cursorOffset: 7,
        selectionFrom: 7,
        selectionTo: 15,
        trigger: 'manual'
      }).selectedText
    ).toBe('selected');
  });
});
