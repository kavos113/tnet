import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InlineCompletionResult } from '@tnet/markdown-editor/shared/inlineCompletion/inlineCompletionTypes';
import { acceptInlineCompletion, rejectInlineCompletion } from './inlineCompletionCommands';
import { inlineCompletionExtension } from './inlineCompletionExtension';

describe('inlineCompletionExtension', () => {
  let parent: HTMLDivElement;

  beforeEach(() => {
    vi.useFakeTimers();
    parent = document.createElement('div');
    document.body.append(parent);
  });

  afterEach(() => {
    vi.useRealTimers();
    parent.remove();
  });

  it('renders ghost text from the requester and accepts it with the command', async () => {
    const requestInlineCompletion = vi.fn().mockResolvedValue({
      id: 'completion-1',
      text: ' world',
      provider: 'mock',
      model: 'mock-inline-completion'
    });
    const view = new EditorView({
      parent,
      state: EditorState.create({
        doc: 'Hello',
        extensions: [
          inlineCompletionExtension({
            requestInlineCompletion,
            debounceMs: 0
          })
        ]
      })
    });

    view.dispatch({ selection: { anchor: 5 } });
    await vi.runAllTimersAsync();

    expect(requestInlineCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        cursorOffset: 5,
        prefix: 'Hello',
        suffix: '',
        trigger: 'automatic'
      }),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
        onPartialText: expect.any(Function)
      })
    );
    expect(parent.querySelector('.inline-completion-ghost')?.textContent).toBe(' world');

    expect(acceptInlineCompletion(view)).toBe(true);
    expect(view.state.doc.toString()).toBe('Hello world');
    expect(view.state.selection.main.head).toBe('Hello world'.length);
    expect(parent.querySelector('.inline-completion-ghost')).toBeNull();

    view.destroy();
  });

  it('renders streaming ghost text before the requester resolves', async () => {
    let resolveCompletion: ((completion: InlineCompletionResult) => void) | undefined;
    const requestInlineCompletion = vi.fn((_context, options) => {
      options?.onPartialText?.(' wor');
      return new Promise<InlineCompletionResult>((resolve) => {
        resolveCompletion = resolve;
      });
    });
    const view = new EditorView({
      parent,
      state: EditorState.create({
        doc: 'Hello',
        extensions: [
          inlineCompletionExtension({
            requestInlineCompletion,
            debounceMs: 0
          })
        ]
      })
    });

    view.dispatch({ selection: { anchor: 5 } });
    await vi.runAllTimersAsync();

    expect(parent.querySelector('.inline-completion-ghost')?.textContent).toBe(' wor');
    resolveCompletion?.({
      id: 'completion-1',
      text: ' world',
      provider: 'mock',
      model: 'mock-inline-completion'
    });
    await Promise.resolve();

    expect(parent.querySelector('.inline-completion-ghost')?.textContent).toBe(' world');

    view.destroy();
  });

  it('aborts stale streaming requests and ignores later chunks', async () => {
    const abortSignals: AbortSignal[] = [];
    const partialCallbacks: Array<(text: string) => void> = [];
    const requestInlineCompletion = vi.fn((_context, options) => {
      if (options?.signal) abortSignals.push(options.signal);
      if (options?.onPartialText) partialCallbacks.push(options.onPartialText);
      options?.onPartialText?.(' wor');
      return new Promise<InlineCompletionResult | null>(() => undefined);
    });
    const view = new EditorView({
      parent,
      state: EditorState.create({
        doc: 'Hello',
        extensions: [
          inlineCompletionExtension({
            requestInlineCompletion,
            debounceMs: 0
          })
        ]
      })
    });

    view.dispatch({ selection: { anchor: 5 } });
    await vi.runAllTimersAsync();
    expect(parent.querySelector('.inline-completion-ghost')?.textContent).toBe(' wor');

    view.dispatch({ changes: { from: 5, insert: '!' } });
    expect(abortSignals[0]?.aborted).toBe(true);
    partialCallbacks[0]?.(' world');
    expect(parent.querySelector('.inline-completion-ghost')).toBeNull();

    view.destroy();
  });

  it('accepts the currently streamed partial ghost text', async () => {
    const requestInlineCompletion = vi.fn((_context, options) => {
      options?.onPartialText?.(' wor');
      return new Promise<InlineCompletionResult | null>(() => undefined);
    });
    const view = new EditorView({
      parent,
      state: EditorState.create({
        doc: 'Hello',
        extensions: [
          inlineCompletionExtension({
            requestInlineCompletion,
            debounceMs: 0
          })
        ]
      })
    });

    view.dispatch({ selection: { anchor: 5 } });
    await vi.runAllTimersAsync();

    expect(acceptInlineCompletion(view)).toBe(true);
    expect(view.state.doc.toString()).toBe('Hello wor');

    view.destroy();
  });

  it('removes ghost text without editing the document when rejected', async () => {
    const requestInlineCompletion = vi.fn().mockResolvedValue({
      id: 'completion-1',
      text: ' world',
      provider: 'mock',
      model: 'mock-inline-completion'
    });
    const view = new EditorView({
      parent,
      state: EditorState.create({
        doc: 'Hello',
        extensions: [
          inlineCompletionExtension({
            requestInlineCompletion,
            debounceMs: 0
          })
        ]
      })
    });

    view.dispatch({ selection: { anchor: 5 } });
    await vi.runAllTimersAsync();

    expect(rejectInlineCompletion(view)).toBe(true);
    expect(view.state.doc.toString()).toBe('Hello');
    expect(parent.querySelector('.inline-completion-ghost')).toBeNull();

    view.destroy();
  });

  it('ignores aborted inline completion requests without warning', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const requestInlineCompletion = vi
      .fn()
      .mockRejectedValue(
        new Error(
          "Error invoking remote method 'markdown:llm:getInlineCompletion': Error: Request was aborted."
        )
      );
    const view = new EditorView({
      parent,
      state: EditorState.create({
        doc: 'Hello',
        extensions: [
          inlineCompletionExtension({
            requestInlineCompletion,
            debounceMs: 0
          })
        ]
      })
    });

    view.dispatch({ selection: { anchor: 5 } });
    await vi.runAllTimersAsync();

    expect(warnSpy).not.toHaveBeenCalled();
    expect(parent.querySelector('.inline-completion-ghost')).toBeNull();

    view.destroy();
    warnSpy.mockRestore();
  });
});
