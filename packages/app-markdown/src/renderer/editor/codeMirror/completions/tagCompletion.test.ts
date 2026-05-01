import { describe, expect, it } from 'vitest';
import { tagCompletion } from './tagCompletion';

const context = (match: { text: string; from: number } | null) =>
  ({
    matchBefore: () => match
  }) as never;

describe('tagCompletion', () => {
  it('returns null outside an HTML tag prefix', () => {
    expect(tagCompletion(context(null))).toBeNull();
  });

  it('filters tag completions by typed prefix', () => {
    const result = tagCompletion(context({ text: '<de', from: 0 }));

    expect(result).toMatchObject({
      from: 1,
      options: [expect.objectContaining({ label: 'details proof' })]
    });
  });
});
