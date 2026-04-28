import { useShortcut } from '@tnet/renderer-core/shortcuts/useShortcut';
import type { NewEntryMode } from './FileTree';

interface UseExplorerShortcutsOptions {
  rootPath: string;
  selectedPath: string | null;
  selectedTarget: string | null;
  startNewEntry: (mode: NewEntryMode) => void;
  startRenameEntry: () => void;
  deleteSelected: () => Promise<void>;
}

export const useExplorerShortcuts = ({
  rootPath,
  selectedPath,
  selectedTarget,
  startNewEntry,
  startRenameEntry,
  deleteSelected
}: UseExplorerShortcutsOptions): void => {
  useShortcut({
    key: 'Delete',
    enabled: Boolean(selectedPath),
    onTrigger: () => {
      deleteSelected().catch((error: unknown) => {
        console.error('Failed to delete file', error);
      });
    }
  });

  useShortcut({
    key: 'r',
    alt: true,
    shift: true,
    enabled: Boolean(selectedTarget),
    onTrigger: startRenameEntry
  });

  useShortcut({
    key: 'n',
    ctrlOrMeta: true,
    enabled: Boolean(rootPath),
    onTrigger: () => startNewEntry('file')
  });

  useShortcut({
    key: 'n',
    ctrlOrMeta: true,
    shift: true,
    enabled: Boolean(rootPath),
    onTrigger: () => startNewEntry('directory')
  });
};
