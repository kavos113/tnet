import { completionStatus } from '@codemirror/autocomplete';
import { Prec, type Extension } from '@codemirror/state';
import {
  keymap,
  ViewPlugin,
  type PluginValue,
  type ViewUpdate,
  type EditorView
} from '@codemirror/view';
import type {
  InlineCompletionContext,
  InlineCompletionRequestOptions,
  InlineCompletionTrigger,
  InlineCompletionResult
} from '@tnet/markdown-editor/shared/inlineCompletion/inlineCompletionTypes';
import { buildEditorInlineCompletionContext } from './inlineCompletionContext';
import { acceptInlineCompletion, rejectInlineCompletion } from './inlineCompletionCommands';
import {
  clearInlineCompletionEffect,
  inlineCompletionDecorations,
  inlineCompletionState,
  setInlineCompletionEffect
} from './inlineCompletionState';

export type InlineCompletionRequester = (
  context: InlineCompletionContext,
  options?: InlineCompletionRequestOptions
) => Promise<InlineCompletionResult | null>;

export interface InlineCompletionExtensionOptions {
  requestInlineCompletion?: InlineCompletionRequester;
  debounceMs?: number;
  maxPrefixChars?: number;
  maxSuffixChars?: number;
}

const defaultInlineCompletionDebounceMs = 600;

const isAbortError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  return (
    error.name === 'AbortError' ||
    error.message.includes('Request was aborted') ||
    error.message.includes('The operation was aborted') ||
    error.message.toLowerCase().includes('aborted')
  );
};

class InlineCompletionPlugin implements PluginValue {
  private timer: number | null = null;
  private requestId = 0;
  private requestController: AbortController | null = null;

  constructor(
    private readonly view: EditorView,
    private readonly options: InlineCompletionExtensionOptions & { debounceMs: number }
  ) {}

  update(update: ViewUpdate): void {
    if (!update.docChanged && !update.selectionSet) return;
    this.clearTimer();
    this.abortRequest();
    this.requestId += 1;

    if (!this.options.requestInlineCompletion) return;
    this.timer = window.setTimeout(() => {
      this.request(update.view, 'automatic');
    }, this.options.debounceMs);
  }

  requestManual(): void {
    this.clearTimer();
    this.abortRequest();
    this.requestId += 1;
    this.view.dispatch({ effects: clearInlineCompletionEffect.of() });

    if (!this.options.requestInlineCompletion) return;
    this.request(this.view, 'manual');
  }

  destroy(): void {
    this.clearTimer();
    this.abortRequest();
    this.requestId += 1;
  }

  private clearTimer(): void {
    if (!this.timer) return;
    window.clearTimeout(this.timer);
    this.timer = null;
  }

  private request(view: EditorView, trigger: InlineCompletionTrigger): void {
    const requestInlineCompletion = this.options.requestInlineCompletion;
    if (!requestInlineCompletion) return;
    if (completionStatus(view.state)) return;

    const requestId = this.requestId;
    const position = view.state.selection.main.head;
    const controller = new AbortController();
    this.requestController = controller;
    const context = buildEditorInlineCompletionContext(view.state, trigger, {
      maxPrefixChars: this.options.maxPrefixChars,
      maxSuffixChars: this.options.maxSuffixChars
    });

    const applyGhostText = (text: string, id = `inline-partial-${requestId}`): void => {
      if (!text.trim()) return;
      if (requestId !== this.requestId) return;
      if (view.state.selection.main.head !== position) return;
      if (completionStatus(view.state)) return;

      view.dispatch({
        effects: setInlineCompletionEffect.of({
          id,
          text,
          from: position
        })
      });
    };

    requestInlineCompletion(context, {
      signal: controller.signal,
      onPartialText: (text) => applyGhostText(text)
    })
      .then((completion) => {
        if (!completion?.text.trim()) return;
        applyGhostText(completion.text, completion.id);
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        console.warn('Failed to load inline completion', error);
      })
      .finally(() => {
        if (this.requestController === controller) {
          this.requestController = null;
        }
      });
  }

  private abortRequest(): void {
    this.requestController?.abort();
    this.requestController = null;
  }
}

export const inlineCompletionExtension = ({
  requestInlineCompletion,
  debounceMs = defaultInlineCompletionDebounceMs,
  maxPrefixChars,
  maxSuffixChars
}: InlineCompletionExtensionOptions): Extension => {
  const inlineCompletionPlugin = ViewPlugin.define(
    (view) =>
      new InlineCompletionPlugin(view, {
        requestInlineCompletion,
        debounceMs,
        maxPrefixChars,
        maxSuffixChars
      })
  );

  return [
    inlineCompletionState,
    inlineCompletionDecorations,
    Prec.highest(
      keymap.of([
        {
          key: 'Tab',
          run: acceptInlineCompletion
        },
        {
          key: 'Escape',
          run: rejectInlineCompletion
        },
        {
          key: 'Mod-Space',
          run: (view) => {
            view.plugin(inlineCompletionPlugin)?.requestManual();
            return true;
          }
        }
      ])
    ),
    inlineCompletionPlugin
  ];
};
