import type {
  InlineCompletionRequest,
  InlineCompletionResult
} from '@tnet/shared/llm/inlineCompletionTypes';
import type { LlmSettings } from '@tnet/app-markdown/shared/config';

export interface InlineCompletionProvider {
  name: string;
  complete: (
    request: InlineCompletionRequest,
    config: LlmSettings,
    signal: AbortSignal
  ) => Promise<InlineCompletionResult | null>;
}
