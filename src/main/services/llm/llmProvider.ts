import type {
  InlineCompletionRequest,
  InlineCompletionResult
} from '@shared/llm/inlineCompletionTypes';
import type { LlmSettings } from '@shared/types/config';

export interface InlineCompletionProvider {
  name: string;
  complete: (
    request: InlineCompletionRequest,
    config: LlmSettings,
    signal: AbortSignal
  ) => Promise<InlineCompletionResult | null>;
}
