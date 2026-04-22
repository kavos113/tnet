import type {
  InlineCompletionRequest,
  InlineCompletionResult
} from '@shared/llm/inlineCompletionTypes';
import { mockInlineCompletionProvider } from './mockInlineCompletionProvider';

export const getInlineCompletion = async (
  request: InlineCompletionRequest
): Promise<InlineCompletionResult | null> => {
  const controller = new AbortController();
  return mockInlineCompletionProvider.complete(request, controller.signal);
};
