import type {
  InlineCompletionRequest,
  InlineCompletionResult
} from '@tnet/app-markdown/shared/llm/inlineCompletionTypes';
import type { LlmProviderType } from '@tnet/app-markdown/shared/config';
import { loadMarkdownProjectConfig } from '../markdownConfigService';
import { geminiSdkProvider } from './geminiSdkProvider';
import { lmStudioProvider } from './lmStudioProvider';
import { localHttpProvider } from './localHttpProvider';
import { mockInlineCompletionProvider } from './mockInlineCompletionProvider';
import { openAiCompatibleProvider } from './openAiCompatibleProvider';
import { openAiSdkProvider } from './openAiSdkProvider';
import type { InlineCompletionProvider } from './llmProvider';

const providerByType: Record<LlmProviderType, InlineCompletionProvider> = {
  mock: mockInlineCompletionProvider,
  'openai-sdk': openAiSdkProvider,
  'gemini-sdk': geminiSdkProvider,
  'lm-studio': lmStudioProvider,
  'local-http': localHttpProvider,
  'openai-compatible': openAiCompatibleProvider
};

const defaultInlineCompletionTimeoutMs = 60000;

const inlineCompletionTimeoutMs = (value: number): number =>
  Number.isFinite(value)
    ? Math.min(Math.max(value, 1000), 300000)
    : defaultInlineCompletionTimeoutMs;

const isAbortError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  return (
    error.name === 'AbortError' ||
    error.message === 'Request was aborted.' ||
    error.message === 'The operation was aborted.' ||
    error.message.toLowerCase().includes('aborted')
  );
};

export const getInlineCompletion = async (
  request: InlineCompletionRequest
): Promise<InlineCompletionResult | null> => {
  const { llm } = await loadMarkdownProjectConfig(request.workspaceRoot);
  if (!llm.llmInlineCompletionEnabled) return null;

  const requestTimeoutMs = inlineCompletionTimeoutMs(llm.llmRequestTimeoutMs);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const provider = providerByType[llm.llmProvider] ?? mockInlineCompletionProvider;
    return await provider.complete(
      request,
      { ...llm, llmRequestTimeoutMs: requestTimeoutMs },
      controller.signal
    );
  } catch (error: unknown) {
    if (isAbortError(error)) return null;
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};
