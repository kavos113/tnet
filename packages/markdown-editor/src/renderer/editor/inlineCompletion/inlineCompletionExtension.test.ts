import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
      })
    );
    expect(parent.querySelector('.inline-completion-ghost')?.textContent).toBe(' world');

    expect(acceptInlineCompletion(view)).toBe(true);
    expect(view.state.doc.toString()).toBe('Hello world');
    expect(view.state.selection.main.head).toBe('Hello world'.length);
    expect(parent.querySelector('.inline-completion-ghost')).toBeNull();

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
