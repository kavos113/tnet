import type {
  InlineCompletionContext as BaseInlineCompletionContext,
  InlineCompletionResult as BaseInlineCompletionResult
} from '@tnet/markdown-editor/shared/inlineCompletion/inlineCompletionTypes';

export type {
  InlineCompletionContext,
  InlineCompletionTrigger,
  InlineCompletionResult,
  InlineCompletionRequestOptions
} from '@tnet/markdown-editor/shared/inlineCompletion/inlineCompletionTypes';

export interface InlineCompletionRequest extends BaseInlineCompletionContext {
  workspaceRoot: string;
  filePath: string;
  language: 'markdown';
}

export interface InlineCompletionStreamRequest extends InlineCompletionRequest {
  streamRequestId: string;
}

export interface InlineCompletionStreamCancelRequest {
  streamRequestId: string;
}

export interface InlineCompletionStreamEvent {
  requestId: string;
  type: 'delta' | 'done' | 'error';
  delta?: string;
  content?: string;
  result?: BaseInlineCompletionResult | null;
  message?: string;
}
