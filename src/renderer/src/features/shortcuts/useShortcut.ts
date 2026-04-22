import { useEffect, useRef } from 'react';

interface UseShortcutOptions {
  key: string;
  ctrlOrMeta?: boolean;
  shift?: boolean;
  alt?: boolean;
  enabled?: boolean;
  target?: 'window' | 'document';
  allowInEditable?: boolean;
  onTrigger: (event: KeyboardEvent) => void;
}

export const isEditableShortcutTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || target.isContentEditable;
};

export const matchesShortcut = (
  event: KeyboardEvent,
  {
    key,
    ctrlOrMeta = false,
    shift = false,
    alt = false
  }: Pick<UseShortcutOptions, 'key' | 'ctrlOrMeta' | 'shift' | 'alt'>
): boolean => {
  const normalizedEventKey = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  const normalizedKey = key.length === 1 ? key.toLowerCase() : key;
  if (normalizedEventKey !== normalizedKey) return false;

  const hasCtrlOrMeta = event.ctrlKey || event.metaKey;
  return hasCtrlOrMeta === ctrlOrMeta && event.shiftKey === shift && event.altKey === alt;
};

export const useShortcut = ({
  key,
  ctrlOrMeta = false,
  shift = false,
  alt = false,
  enabled = true,
  target = 'window',
  allowInEditable = false,
  onTrigger
}: UseShortcutOptions): void => {
  const onTriggerRef = useRef(onTrigger);
  onTriggerRef.current = onTrigger;

  useEffect(() => {
    const eventTarget = target === 'document' ? document : window;
    const onKeyDown = (event: Event): void => {
      if (!(event instanceof KeyboardEvent)) return;
      if (!enabled) return;
      if (!allowInEditable && isEditableShortcutTarget(event.target)) return;
      if (!matchesShortcut(event, { key, ctrlOrMeta, shift, alt })) return;

      event.preventDefault();
      onTriggerRef.current(event);
    };

    eventTarget.addEventListener('keydown', onKeyDown);
    return () => eventTarget.removeEventListener('keydown', onKeyDown);
  }, [allowInEditable, alt, ctrlOrMeta, enabled, key, shift, target]);
};
