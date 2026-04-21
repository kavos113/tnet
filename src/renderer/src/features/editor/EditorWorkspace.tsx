import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { useAppDispatch, useAppSelector } from '@renderer/app/hooks';
import { PreviewPane, type PreviewPaneHandle } from '@renderer/features/preview/PreviewPane';
import { tnetApi } from '@renderer/lib/tnetApi';
import { markActiveSaved, setViewMode, updateActiveContent } from './editorSlice';
import { EditorPane, type EditorPaneHandle } from './EditorPane';
import { applyScrollRatio, getScrollRatio } from './scrollSync';
import { TabBar } from './TabBar';

export const EditorWorkspace = (): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const editorPaneRef = useRef<EditorPaneHandle | null>(null);
  const previewPaneRef = useRef<PreviewPaneHandle | null>(null);
  const isSyncingScrollRef = useRef(false);
  const { openedFiles, activeIndex, viewMode } = useAppSelector((state) => state.editor);
  const rootPath = useAppSelector((state) => state.workspace.rootPath);
  const settings = useAppSelector((state) => state.workspace.settings);
  const activeFile = activeIndex >= 0 ? openedFiles[activeIndex] : null;

  const canSave = useMemo(() => Boolean(activeFile && rootPath), [activeFile, rootPath]);

  const saveActiveFile = async (): Promise<void> => {
    if (!activeFile || !canSave) return;

    await tnetApi.file.write(activeFile.path, activeFile.content, rootPath);
    const savedContent = await tnetApi.file.read(activeFile.path);
    dispatch(markActiveSaved({ content: savedContent }));
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        saveActiveFile().catch((error: unknown) => {
          console.error('Failed to save file', error);
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  useEffect(() => {
    if (viewMode !== 'split' || !activeFile) return;

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
  }, [activeFile, viewMode]);

  return (
    <main
      className="editor-workspace"
      style={
        {
          '--editor-font-family': settings.editorFontFamily,
          '--editor-font-size': `${settings.editorFontSize}px`,
          '--preview-font-family': settings.previewFontFamily,
          '--preview-font-size': `${settings.previewFontSize}px`
        } as CSSProperties
      }
    >
      <TabBar />
      {activeFile ? (
        <>
          <div className="editor-title">
            <span>{activeFile.path}</span>
            <div className="editor-actions">
              <button
                type="button"
                className={`mode-button ${viewMode === 'editor' ? 'active' : ''}`}
                onClick={() => dispatch(setViewMode('editor'))}
              >
                Editor
              </button>
              <button
                type="button"
                className={`mode-button ${viewMode === 'split' ? 'active' : ''}`}
                onClick={() => dispatch(setViewMode('split'))}
              >
                Split
              </button>
              <button
                type="button"
                className={`mode-button ${viewMode === 'preview' ? 'active' : ''}`}
                onClick={() => dispatch(setViewMode('preview'))}
              >
                Preview
              </button>
              <button
                type="button"
                className="save-button"
                disabled={!canSave}
                onClick={() => {
                  saveActiveFile().catch((error: unknown) => {
                    console.error('Failed to save file', error);
                  });
                }}
              >
                Save
              </button>
            </div>
          </div>
          <div className="editor-content-split">
            {viewMode !== 'preview' ? (
              <EditorPane
                ref={editorPaneRef}
                content={activeFile.content}
                rootDir={rootPath}
                onChange={(content) => dispatch(updateActiveContent(content))}
              />
            ) : null}
            {viewMode === 'split' ? <div className="resizer" /> : null}
            {viewMode !== 'editor' ? (
              <PreviewPane ref={previewPaneRef} markdown={activeFile.content} />
            ) : null}
          </div>
        </>
      ) : (
        <div className="empty-editor">No file selected</div>
      )}
    </main>
  );
};
