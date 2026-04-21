import { useAppDispatch, useAppSelector } from '@renderer/app/hooks';
import { closeFile, switchFile } from './editorSlice';

export const TabBar = (): React.JSX.Element | null => {
  const dispatch = useAppDispatch();
  const { openedFiles, activeIndex } = useAppSelector((state) => state.editor);

  if (openedFiles.length === 0) return null;

  return (
    <div className="tab-bar">
      {openedFiles.map((file, index) => (
        <button
          key={file.path}
          type="button"
          className={`tab ${index === activeIndex ? 'active' : ''}`}
          onClick={() => dispatch(switchFile(index))}
        >
          <span className="tab-name">{file.displayName}</span>
          {file.isModified ? <span className="modified-indicator">*</span> : null}
          <span
            className="tab-close"
            role="button"
            tabIndex={0}
            aria-label={`Close ${file.displayName}`}
            onClick={(event) => {
              event.stopPropagation();
              dispatch(closeFile(index));
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                dispatch(closeFile(index));
              }
            }}
          >
            x
          </span>
        </button>
      ))}
    </div>
  );
};
