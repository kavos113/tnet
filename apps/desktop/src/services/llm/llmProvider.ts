import type {
  InlineCompletionRequest,
  InlineCompletionResult
} from '@tnet/shared/llm/inlineCompletionTypes';
import type { LlmSettings } from '@tnet/shared/types/config';

export interface InlineCompletionProvider {
  name: string;
  complete: (
    request: InlineCompletionRequest,
    config: LlmSettings,
    signal: AbortSignal
  ) => Promise<InlineCompletionResult | null>;
}
