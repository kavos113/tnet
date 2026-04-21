import type { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { tnetApi } from '@renderer/lib/tnetApi';
import { toWorkspaceRelativePath } from '@shared/path/pathUtils';
import { latexCompletions, tagCompletions } from './completionData';

export const keywordCompletion =
  (rootDir: string) =>
  async (context: CompletionContext): Promise<CompletionResult | null> => {
    const match = context.matchBefore(/\[\[([^\]]*)$/);
    if (!match || !rootDir) return null;

    const keywords = await tnetApi.keyword.loadIndex(rootDir);
    return {
      from: match.from + 2,
      options: Object.entries(keywords).map(([name, filePath]) => ({
        label: name,
        detail: toWorkspaceRelativePath(rootDir, filePath),
        apply: `${filePath}|${name}`,
        type: 'keyword' as const
      })),
      validFor: /^\[\[[^\]]*$/
    };
  };

export const tagCompletion = (context: CompletionContext): CompletionResult | null => {
  const match = context.matchBefore(/<([a-zA-Z]*)$/);
  if (!match) return null;

  const word = match.text.slice(1).toLowerCase();
  return {
    from: match.from + 1,
    options: tagCompletions.filter((item) => item.apply?.toString().toLowerCase().startsWith(word)),
    validFor: /^<([a-zA-Z]*)$/
  };
};

export const latexCompletion = (context: CompletionContext): CompletionResult | null => {
  const match = context.matchBefore(/\\([a-zA-Z]*)$/);
  if (!match) return null;

  const word = match.text.toLowerCase();
  return {
    from: match.from + 1,
    options: latexCompletions.filter((item) => item.label.toLowerCase().startsWith(word)),
    validFor: /^\\([a-zA-Z]*)$/
  };
};
