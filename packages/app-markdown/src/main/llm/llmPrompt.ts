import type { InlineCompletionRequest } from '@tnet/app-markdown/shared/llm/inlineCompletionTypes';

export const buildInlineCompletionPrompt = (request: InlineCompletionRequest): string => {
  return [
    'Complete the Markdown text at the cursor.',
    'Return only the text that should be inserted.',
    'Do not repeat text that already exists before or after the cursor.',
    '',
    '<prefix>',
    request.prefix,
    '</prefix>',
    '<suffix>',
    request.suffix,
    '</suffix>'
  ].join('\n');
};
