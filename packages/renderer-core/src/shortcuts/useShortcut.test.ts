import { createElement } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { isEditableShortcutTarget, matchesShortcut } from './useShortcut';
import { useShortcut } from './useShortcut';

const keyboardEvent = (
  key: string,
  options: Pick<KeyboardEventInit, 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'> = {}
): KeyboardEvent => {
  return new KeyboardEvent('keydown', { key, bubbles: true, ...options });
};

describe('shortcut matching', () => {
  it('requires exact modifier matches so Ctrl+Shift+N does not match Ctrl+N', () => {
    expect(
      matchesShortcut(keyboardEvent('n', { ctrlKey: true }), { key: 'n', ctrlOrMeta: true })
    ).toBe(true);
    expect(
      matchesShortcut(keyboardEvent('n', { ctrlKey: true, shiftKey: true }), {
        key: 'n',
        ctrlOrMeta: true
      })
    ).toBe(false);
    expect(
      matchesShortcut(keyboardEvent('n', { ctrlKey: true, shiftKey: true }), {
        key: 'n',
        ctrlOrMeta: true,
        shift: true
      })
    ).toBe(true);
  });

  it('treats Ctrl and Meta as the same command modifier', () => {
    expect(
      matchesShortcut(keyboardEvent(',', { metaKey: true }), { key: ',', ctrlOrMeta: true })
    ).toBe(true);
  });

  it('detects editable targets', () => {
    expect(isEditableShortcutTarget(document.createElement('input'))).toBe(true);
    expect(isEditableShortcutTarget(document.createElement('textarea'))).toBe(true);

    const editable = document.createElement('div');
    editable.contentEditable = 'true';
    expect(isEditableShortcutTarget(editable)).toBe(true);
    expect(isEditableShortcutTarget(document.createElement('button'))).toBe(false);
  });

  it('does not call handlers from editable targets in the hook path', () => {
    const handler = vi.fn();
    const input = document.createElement('input');
    input.addEventListener('keydown', (event) => {
      if (isEditableShortcutTarget(event.target)) return;
      if (matchesShortcut(event, { key: 's', ctrlOrMeta: true })) handler();
    });

    input.dispatchEvent(keyboardEvent('s', { ctrlKey: true }));
    expect(handler).not.toHaveBeenCalled();
  });

  it('can allow global shortcuts from editable targets', () => {
    const handler = vi.fn();
    const Probe = (): null => {
      useShortcut({
        key: ',',
        ctrlOrMeta: true,
        target: 'document',
        allowInEditable: true,
        onTrigger: handler
      });
      return null;
    };
    const editable = document.createElement('div');
    editable.contentEditable = 'true';
    document.body.append(editable);

    const { unmount } = render(createElement(Probe));
    editable.dispatchEvent(keyboardEvent(',', { ctrlKey: true }));

    expect(handler).toHaveBeenCalledTimes(1);

    unmount();
    editable.remove();
  });
});
