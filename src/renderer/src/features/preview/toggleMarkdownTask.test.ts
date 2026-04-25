import { describe, expect, it } from 'vitest';
import { toggleMarkdownTask } from './toggleMarkdownTask';

describe('toggleMarkdownTask', () => {
  it('checks an unchecked task list item at the given source line', () => {
    expect(toggleMarkdownTask('- [ ] task', 1, true)).toBe('- [x] task');
  });

  it('unchecks a checked task list item at the given source line', () => {
    expect(toggleMarkdownTask('- [x] task', 1, false)).toBe('- [ ] task');
  });

  it('supports ordered list task items', () => {
    expect(toggleMarkdownTask('1. [ ] task', 1, true)).toBe('1. [x] task');
  });

  it('returns the original markdown when the line is not a task list item', () => {
    expect(toggleMarkdownTask('paragraph', 1, true)).toBe('paragraph');
  });
});
