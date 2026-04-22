import { useState } from 'react';
import { EditorWorkspace } from '@renderer/features/editor/EditorWorkspace';
import { ExplorerPanel } from '@renderer/features/explorer/ExplorerPanel';
import { SettingsDialog } from '@renderer/features/settings/SettingsDialog';
import { useShortcut } from '@renderer/features/shortcuts/useShortcut';
import { usePersistSession } from '@renderer/features/workspace/usePersistSession';
import { useRestoreWorkspace } from '@renderer/features/workspace/useRestoreWorkspace';

export const App = (): React.JSX.Element => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isRestoring = useRestoreWorkspace();
  usePersistSession({ enabled: !isRestoring });

  useShortcut({
    key: ',',
    ctrlOrMeta: true,
    target: 'document',
    allowInEditable: true,
    onTrigger: () => setIsSettingsOpen(true)
  });

  return (
    <div className="app-shell">
      <ExplorerPanel />
      <EditorWorkspace />
      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};
