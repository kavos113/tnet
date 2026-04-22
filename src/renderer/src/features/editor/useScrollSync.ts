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
  const isSyncingScrollRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const editorScroller = editorPaneRef.current?.getScroller();
    const previewElement = previewPaneRef.current?.getPreviewElement();
    if (!editorScroller || !previewElement) return;

    let animationFrame = 0;

    const syncScroll = (source: HTMLElement, target: HTMLElement): void => {
      if (isSyncingScrollRef.current) return;

      isSyncingScrollRef.current = true;
      applyScrollRatio(target, getScrollRatio(source));

      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        isSyncingScrollRef.current = false;
      });
    };

    const onEditorScroll = (): void => syncScroll(editorScroller, previewElement);
    const onPreviewScroll = (): void => syncScroll(previewElement, editorScroller);

    editorScroller.addEventListener('scroll', onEditorScroll);
    previewElement.addEventListener('scroll', onPreviewScroll);

    return () => {
      editorScroller.removeEventListener('scroll', onEditorScroll);
      previewElement.removeEventListener('scroll', onPreviewScroll);
      cancelAnimationFrame(animationFrame);
      isSyncingScrollRef.current = false;
    };
  }, [editorPaneRef, enabled, previewPaneRef]);
};
