import { useEditorStore } from './editorStore';

export const EditorWorkspace = (): React.JSX.Element => {
  const openedFiles = useEditorStore((state) => state.openedFiles);
  const activeIndex = useEditorStore((state) => state.activeIndex);
  const activeFile = activeIndex >= 0 ? openedFiles[activeIndex] : null;

  return (
    <main className="editor-workspace">
      {activeFile ? (
        <>
          <div className="editor-title">{activeFile.path}</div>
          <textarea className="editor-textarea" value={activeFile.content} readOnly />
        </>
      ) : (
        <div className="empty-editor">No file selected</div>
      )}
    </main>
  );
};
