import { type RefObject, useEffect, useRef } from 'react';
import type { PreviewPaneHandle } from '@renderer/features/preview/PreviewPane';
import type { EditorPaneHandle } from './EditorPane';
import { applyScrollRatio, getScrollRatio } from './scrollSync';

interface UseScrollSyncOptions {
  editorPaneRef: RefObject<EditorPaneHandle | null>;
  previewPaneRef: RefObject<PreviewPaneHandle | null>;
  enabled: boolean;
}

export const useScrollSync = ({
  editorPaneRef,
  previewPaneRef,
  enabled
}: UseScrollSyncOptions): void => {
  const ignoredProgrammaticScrollRef = useRef<{
    element: HTMLElement;
    scrollTop: number;
  } | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let attachFrame = 0;
    let syncFrame = 0;
    let cleanupListeners: (() => void) | null = null;
    let pendingSync: { source: HTMLElement; target: HTMLElement } | null = null;

    const scheduleScrollSync = (source: HTMLElement, target: HTMLElement): void => {
      const ignoredScroll = ignoredProgrammaticScrollRef.current;
      if (ignoredScroll?.element === source && ignoredScroll.scrollTop === source.scrollTop) {
        ignoredProgrammaticScrollRef.current = null;
        return;
      }

      pendingSync = { source, target };
      if (syncFrame) return;

      syncFrame = requestAnimationFrame(() => {
        syncFrame = 0;
        const nextSync = pendingSync;
        pendingSync = null;
        if (!nextSync) return;

        applyScrollRatio(nextSync.target, getScrollRatio(nextSync.source));
        ignoredProgrammaticScrollRef.current = {
          element: nextSync.target,
          scrollTop: nextSync.target.scrollTop
        };
      });
    };

    const attachScrollListeners = (): void => {
      if (cleanupListeners) return;

      const editorScroller = editorPaneRef.current?.getScroller();
      const previewElement = previewPaneRef.current?.getPreviewElement();
      if (!editorScroller || !previewElement) {
        attachFrame = requestAnimationFrame(attachScrollListeners);
        return;
      }

      const onEditorScroll = (): void => scheduleScrollSync(editorScroller, previewElement);
      const onPreviewScroll = (): void => scheduleScrollSync(previewElement, editorScroller);

      editorScroller.addEventListener('scroll', onEditorScroll);
      previewElement.addEventListener('scroll', onPreviewScroll);

      cleanupListeners = () => {
        editorScroller.removeEventListener('scroll', onEditorScroll);
        previewElement.removeEventListener('scroll', onPreviewScroll);
      };
    };

    attachScrollListeners();

    return () => {
      cleanupListeners?.();
      cancelAnimationFrame(attachFrame);
      cancelAnimationFrame(syncFrame);
      ignoredProgrammaticScrollRef.current = null;
    };
  }, [editorPaneRef, enabled, previewPaneRef]);
};
