import { describe, expect, it } from 'vitest';
import type { InlineCompletionRequest } from '@shared/llm/inlineCompletionTypes';
import { getInlineCompletion } from './inlineCompletionService';

const createRequest = (
  overrides: Partial<InlineCompletionRequest> = {}
): InlineCompletionRequest => ({
  workspaceRoot: '/workspace',
  filePath: 'note.md',
  language: 'markdown',
  cursorOffset: 5,
  prefix: 'Hello',
  suffix: '',
  selectedText: '',
  trigger: 'manual',
  ...overrides
});

describe('getInlineCompletion', () => {
  it('returns the mock inline completion for manual requests', async () => {
    await expect(getInlineCompletion(createRequest())).resolves.toMatchObject({
      text: ' completed by inline LLM',
      provider: 'mock',
      model: 'mock-inline-completion'
    });
  });

  it('does not return noisy mock suggestions for automatic requests', async () => {
    await expect(getInlineCompletion(createRequest({ trigger: 'automatic' }))).resolves.toBeNull();
  });
});
