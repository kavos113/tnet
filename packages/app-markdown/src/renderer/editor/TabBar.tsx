import { useAppDispatch, useAppSelector } from '@tnet/app-markdown/renderer/storeHooks';
import { closeFile, setActiveGroup, switchFile, type EditorGroupId } from './editorSlice';

interface TabBarProps {
  groupId: EditorGroupId;
}

export const TabBar = ({ groupId }: TabBarProps): React.JSX.Element | null => {
  const dispatch = useAppDispatch();
  const { filesByPath, groups } = useAppSelector((state) => state.editor);
  const group = groups[groupId];

  if (group.tabs.length === 0) return null;

  return (
    <div className="tab-bar" onMouseDown={() => dispatch(setActiveGroup(groupId))}>
      {group.tabs.map((path, index) => {
        const file = filesByPath[path];
        if (!file) return null;

        return (
          <button
            key={path}
            type="button"
            className={`tab ${index === group.activeIndex ? 'active' : ''}`}
            onClick={() => dispatch(switchFile({ groupId, index }))}
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
                dispatch(closeFile({ groupId, index }));
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  event.stopPropagation();
                  dispatch(closeFile({ groupId, index }));
                }
              }}
            >
              x
            </span>
          </button>
        );
      })}
    </div>
  );
};
