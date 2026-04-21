import { describe, expect, it } from 'vitest';
import { extractKeywordContent, injectKeywordNames, parseKeywords } from '../keywordParser';

describe('keywordParser', () => {
  it('parses keyword tags and attributes', () => {
    const keywords = parseKeywords(
      '<keyword name="K1">body</keyword><keyword noindex number-class="1" prefix="定理">x</keyword>'
    );

    expect(keywords).toHaveLength(2);
    expect(keywords[0]).toMatchObject({ name: 'K1', content: 'body', noindex: false });
    expect(keywords[1]).toMatchObject({
      name: '',
      noindex: true,
      numberClass: '1',
      prefix: '定理'
    });
  });

  it('extracts content by keyword name', () => {
    const content = '<keyword name="A">alpha</keyword><keyword name="B">beta</keyword>';

    expect(extractKeywordContent(content, 'B')).toBe('beta');
    expect(extractKeywordContent(content, 'NOPE')).toBeNull();
  });

  it('injects generated names for number-class keywords', () => {
    let count = 0;
    const result = injectKeywordNames(
      '<keyword number-class="2" prefix="補題">body</keyword>',
      (numberClass, prefix) => {
        count += 1;
        return `${prefix} ${numberClass}.${count}`;
      }
    );

    expect(result).toContain('name="補題 2.1"');
  });
});
