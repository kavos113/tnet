import type { SaveTaskInput } from './tasksTypes';

export interface MarkdownTaskLink {
  lineNumber: number;
  title: string;
  completed: boolean;
  linkedEntityId: string;
  sourceUrl?: string;
}

export const parseMarkdownTaskLinks = (
  markdown: string,
  options: { sourceUrl?: string } = {}
): MarkdownTaskLink[] =>
  markdown
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .flatMap((line, index) => {
      const match = /^\s*[-*+]\s+\[([ xX])\]\s+(.+?)\s*$/.exec(line);
      if (!match) return [];
      const lineNumber = index + 1;
      return [
        {
          lineNumber,
          title: match[2],
          completed: match[1].toLowerCase() === 'x',
          linkedEntityId: `markdown:${lineNumber}`,
          sourceUrl: options.sourceUrl
        }
      ];
    });

export const markdownTaskLinkToSaveInput = (task: MarkdownTaskLink): SaveTaskInput => ({
  title: task.title,
  linkedEntityId: task.linkedEntityId,
  sourceUrl: task.sourceUrl,
  completedAt: task.completed ? new Date(0).toISOString() : undefined
});
