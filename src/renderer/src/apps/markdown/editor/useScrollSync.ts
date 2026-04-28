import { type RefObject, useEffect, useRef } from 'react';
import type { PreviewPaneHandle } from '@renderer/apps/markdown/preview/PreviewPane';
import type { EditorPaneHandle } from './EditorPane';
import {
  applyScrollRatio,
  findPreviewElementForSourceLine,
  getEditorTopLine,
  getScrollRatio,
  getSourceLineAtPreviewTop,
  scrollEditorToLine,
  scrollPreviewToElement
} from './scrollSync';

interface UseScrollSyncOptions {
  editorPaneRef: RefObject<EditorPaneHandle | null>;
  previewPaneRef: RefObject<PreviewPaneHandle | null>;
  enabled: boolean;
  syncKey?: unknown;
}

export const useScrollSync = ({
  editorPaneRef,
  previewPaneRef,
  enabled,
  syncKey
}: UseScrollSyncOptions): void => {
  const ignoredProgrammaticScrollRef = useRef<{
    element: HTMLElement;
    scrollTop: number;
  } | null>(null);
  const lastScrollSourceRef = useRef<'editor' | 'preview'>('editor');

  useEffect(() => {
    if (!enabled) return;

    let attachFrame = 0;
    let syncFrame = 0;
    let cleanupListeners: (() => void) | null = null;
    let pendingSync: { source: 'editor' | 'preview' } | null = null;

    const syncEditorToPreview = (): void => {
      const view = editorPaneRef.current?.getView();
      const previewElement = previewPaneRef.current?.getPreviewElement();
      if (!view || !previewElement) return;

      const previewTarget = findPreviewElementForSourceLine(previewElement, getEditorTopLine(view));
      if (previewTarget) {
        scrollPreviewToElement(previewElement, previewTarget);
      } else {
        applyScrollRatio(previewElement, getScrollRatio(view.scrollDOM));
      }
      ignoredProgrammaticScrollRef.current = {
        element: previewElement,
        scrollTop: previewElement.scrollTop
      };
    };

    const syncPreviewToEditor = (): void => {
      const view = editorPaneRef.current?.getView();
      const previewElement = previewPaneRef.current?.getPreviewElement();
      if (!view || !previewElement) return;

      const sourceLine = getSourceLineAtPreviewTop(previewElement);
      if (sourceLine !== null) {
        scrollEditorToLine(view, sourceLine);
      } else {
        applyScrollRatio(view.scrollDOM, getScrollRatio(previewElement));
      }
      ignoredProgrammaticScrollRef.current = {
        element: view.scrollDOM,
        scrollTop: view.scrollDOM.scrollTop
      };
    };

    const scheduleLastSourceSync = (): void => {
      if (syncFrame) return;

      syncFrame = requestAnimationFrame(() => {
        syncFrame = 0;
        pendingSync = null;
        if (lastScrollSourceRef.current === 'preview') {
          syncPreviewToEditor();
        } else {
          syncEditorToPreview();
        }
      });
    };

    const scheduleScrollSync = (sourceName: 'editor' | 'preview', source: HTMLElement): void => {
      const ignoredScroll = ignoredProgrammaticScrollRef.current;
      if (ignoredScroll?.element === source && ignoredScroll.scrollTop === source.scrollTop) {
        ignoredProgrammaticScrollRef.current = null;
        return;
      }

      lastScrollSourceRef.current = sourceName;
      pendingSync = { source: sourceName };
      if (syncFrame) return;

      syncFrame = requestAnimationFrame(() => {
        syncFrame = 0;
        const nextSync = pendingSync;
        pendingSync = null;
        if (!nextSync) return;

        if (nextSync.source === 'editor') {
          syncEditorToPreview();
        } else {
          syncPreviewToEditor();
        }
      });
    };

    const attachScrollListeners = (): void => {
      if (cleanupListeners) return;

      const editorView = editorPaneRef.current?.getView();
      const editorScroller = editorView?.scrollDOM ?? editorPaneRef.current?.getScroller();
      const previewElement = previewPaneRef.current?.getPreviewElement();
      if (!editorScroller || !previewElement) {
        attachFrame = requestAnimationFrame(attachScrollListeners);
        return;
      }

      const onEditorScroll = (): void => scheduleScrollSync('editor', editorScroller);
      const onPreviewScroll = (): void => scheduleScrollSync('preview', previewElement);

      editorScroller.addEventListener('scroll', onEditorScroll);
      previewElement.addEventListener('scroll', onPreviewScroll);

      cleanupListeners = () => {
        editorScroller.removeEventListener('scroll', onEditorScroll);
        previewElement.removeEventListener('scroll', onPreviewScroll);
      };

      scheduleLastSourceSync();
    };

    attachScrollListeners();

    return () => {
      cleanupListeners?.();
      cancelAnimationFrame(attachFrame);
      cancelAnimationFrame(syncFrame);
      ignoredProgrammaticScrollRef.current = null;
    };
  }, [editorPaneRef, enabled, previewPaneRef, syncKey]);
};
