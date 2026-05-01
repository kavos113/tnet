import { describe, expect, it } from 'vitest';
import { markdownTaskLinkToSaveInput, parseMarkdownTaskLinks } from './markdownTasks';

describe('markdown task links', () => {
  it('parses markdown task lists with stable line backlinks', () => {
    const tasks = parseMarkdownTaskLinks(
      `# Notes
- [ ] Draft proposal
  - [x] Follow up
plain text`,
      { sourceUrl: 'file:///notes/today.md' }
    );

    expect(tasks).toEqual([
      {
        lineNumber: 2,
        title: 'Draft proposal',
        completed: false,
        linkedEntityId: 'markdown:2',
        sourceUrl: 'file:///notes/today.md'
      },
      {
        lineNumber: 3,
        title: 'Follow up',
        completed: true,
        linkedEntityId: 'markdown:3',
        sourceUrl: 'file:///notes/today.md'
      }
    ]);
  });

  it('converts markdown task links to save inputs', () => {
    expect(
      markdownTaskLinkToSaveInput({
        lineNumber: 4,
        title: 'Review',
        completed: true,
        linkedEntityId: 'markdown:4',
        sourceUrl: 'file:///notes/today.md'
      })
    ).toEqual({
      title: 'Review',
      linkedEntityId: 'markdown:4',
      sourceUrl: 'file:///notes/today.md',
      completedAt: '1970-01-01T00:00:00.000Z'
    });
  });
});
