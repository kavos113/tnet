import type {
  InlineCompletionRequest,
  InlineCompletionResult
} from '@shared/llm/inlineCompletionTypes';
import type { LlmProviderType } from '@shared/types/config';
import { loadProjectConfig } from '../projectConfigService';
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

const inlineCompletionTimeoutMs = 15000;

export const getInlineCompletion = async (
  request: InlineCompletionRequest
): Promise<InlineCompletionResult | null> => {
  const config = await loadProjectConfig(request.workspaceRoot);
  if (!config.llmInlineCompletionEnabled) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), inlineCompletionTimeoutMs);

  try {
    const provider = providerByType[config.llmProvider] ?? mockInlineCompletionProvider;
    return await provider.complete(request, config, controller.signal);
  } finally {
    clearTimeout(timeout);
  }
};
