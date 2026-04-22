import type {
  InlineCompletionRequest,
  InlineCompletionResult
} from '@shared/llm/inlineCompletionTypes';

export interface InlineCompletionProvider {
  name: string;
  complete: (
    request: InlineCompletionRequest,
    signal: AbortSignal
  ) => Promise<InlineCompletionResult | null>;
}
