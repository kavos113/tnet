import { useRef, type CSSProperties } from 'react';
import { useAppDispatch, useAppSelector } from '@renderer/app/hooks';
import { PreviewPane, type PreviewPaneHandle } from '@renderer/features/preview/PreviewPane';
import { useShortcut } from '@renderer/features/shortcuts/useShortcut';
import { useActiveWorkspaceApi } from '@renderer/features/workspace/useActiveWorkspaceApi';
import { setViewMode, updateActiveContent } from './editorSlice';
import { EditorPane, type EditorPaneHandle } from './EditorPane';
import { TabBar } from './TabBar';
import { useSaveActiveFile } from './useSaveActiveFile';
import { useScrollSync } from './useScrollSync';

export const EditorWorkspace = (): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const editorPaneRef = useRef<EditorPaneHandle | null>(null);
  const previewPaneRef = useRef<PreviewPaneHandle | null>(null);
  const workspaceApi = useActiveWorkspaceApi();
  const { openedFiles, activeIndex, viewMode } = useAppSelector((state) => state.editor);
  const settings = useAppSelector((state) => state.workspace.settings);
  const activeFile = activeIndex >= 0 ? openedFiles[activeIndex] : null;
  const { canSave, saveActiveFile } = useSaveActiveFile();

  useShortcut({
    key: 's',
    ctrlOrMeta: true,
    enabled: canSave,
    onTrigger: () => {
      saveActiveFile().catch((error: unknown) => {
        console.error('Failed to save file', error);
      });
    }
  });

  useScrollSync({
    editorPaneRef,
    previewPaneRef,
    enabled: viewMode === 'split' && Boolean(activeFile)
  });

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
                onChange={(content) => dispatch(updateActiveContent(content))}
                loadKeywordIndex={workspaceApi.loadKeywordIndex}
              />
            ) : null}
            {viewMode === 'split' ? <div className="resizer" /> : null}
            {viewMode !== 'editor' ? (
              <PreviewPane
                ref={previewPaneRef}
                markdown={activeFile.content}
                onOpenInternalLink={workspaceApi.openFile}
                loadKeywordContent={workspaceApi.getKeywordContent}
              />
            ) : null}
          </div>
        </>
      ) : (
        <div className="empty-editor">No file selected</div>
      )}
    </main>
  );
};
