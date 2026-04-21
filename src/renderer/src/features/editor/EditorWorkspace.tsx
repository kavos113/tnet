import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@renderer/app/hooks';
import { tnetApi } from '@renderer/lib/tnetApi';
import { markActiveSaved, setViewMode, updateActiveContent } from './editorSlice';
import { TabBar } from './TabBar';

export const EditorWorkspace = (): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const { openedFiles, activeIndex, viewMode } = useAppSelector((state) => state.editor);
  const rootPath = useAppSelector((state) => state.workspace.rootPath);
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

  return (
    <main className="editor-workspace">
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
              <textarea
                className="editor-textarea"
                value={activeFile.content}
                onChange={(event) => dispatch(updateActiveContent(event.target.value))}
              />
            ) : null}
            {viewMode === 'split' ? <div className="resizer" /> : null}
            {viewMode !== 'editor' ? (
              <div className="preview-placeholder">
                <div className="preview-empty">Markdown preview will be migrated next.</div>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="empty-editor">No file selected</div>
      )}
    </main>
  );
};
