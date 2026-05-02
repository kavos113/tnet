import { TabBar as SharedTabBar } from '@tnet/ui';
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

  const tabs = group.tabs
    .map((path) => {
      const file = filesByPath[path];
      if (!file) return null;
      return { id: path, label: file.displayName, isModified: file.isModified };
    })
    .filter((tab): tab is { id: string; label: string; isModified: boolean } => tab !== null);

  return (
    <SharedTabBar
      tabs={tabs}
      activeId={group.tabs[group.activeIndex] ?? null}
      ariaLabel="Open markdown files"
      onMouseDown={() => dispatch(setActiveGroup(groupId))}
      onSelectTab={(_, index) => dispatch(switchFile({ groupId, index }))}
      onCloseTab={(_, index) => dispatch(closeFile({ groupId, index }))}
    />
  );
};
