import type { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

export type KeywordIndexLoader = () => Promise<Record<string, string>>;

export const keywordCompletion =
  (loadKeywordIndex: KeywordIndexLoader) =>
  async (context: CompletionContext): Promise<CompletionResult | null> => {
    const match = context.matchBefore(/\[\[([^\]]*)$/);
    if (!match) return null;

    const keywords = await loadKeywordIndex();
    return {
      from: match.from + 2,
      options: Object.entries(keywords).map(([name, filePath]) => ({
        label: name,
        detail: filePath,
        apply: `${filePath}|${name}`,
        type: 'keyword' as const
      })),
      validFor: /^\[\[[^\]]*$/
    };
  };
