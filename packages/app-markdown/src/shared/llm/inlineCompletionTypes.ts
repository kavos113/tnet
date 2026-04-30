import type { InlineCompletionContext as BaseInlineCompletionContext } from '@tnet/markdown-editor/shared/inlineCompletion/inlineCompletionTypes';

export type {
  InlineCompletionContext,
  InlineCompletionTrigger,
  InlineCompletionResult
} from '@tnet/markdown-editor/shared/inlineCompletion/inlineCompletionTypes';

export interface InlineCompletionRequest extends BaseInlineCompletionContext {
  workspaceRoot: string;
  filePath: string;
  language: 'markdown';
}
