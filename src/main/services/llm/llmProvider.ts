import type {
  InlineCompletionRequest,
  InlineCompletionResult
} from '@shared/llm/inlineCompletionTypes';
import type { ProjectConfig } from '@shared/types/config';

export interface InlineCompletionProvider {
  name: string;
  complete: (
    request: InlineCompletionRequest,
    config: ProjectConfig,
    signal: AbortSignal
  ) => Promise<InlineCompletionResult | null>;
}
