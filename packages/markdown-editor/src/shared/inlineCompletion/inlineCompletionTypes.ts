export type InlineCompletionTrigger = 'automatic' | 'manual';

export interface InlineCompletionContext {
  prefix: string;
  suffix: string;
  selectedText: string;
  cursorOffset: number;
  trigger: InlineCompletionTrigger;
}

export interface InlineCompletionRequest extends InlineCompletionContext {
  workspaceRoot: string;
  filePath: string;
  language: 'markdown';
}

export interface InlineCompletionResult {
  id: string;
  text: string;
  provider: string;
  model: string;
}

export interface InlineCompletionRequestOptions {
  signal?: AbortSignal;
  onPartialText?: (text: string) => void;
}
