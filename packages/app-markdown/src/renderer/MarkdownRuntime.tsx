import { usePersistMarkdownSession } from './workspace/usePersistMarkdownSession';
import { useRestoreMarkdownWorkspace } from './workspace/useRestoreMarkdownWorkspace';

export const MarkdownRuntime = (): null => {
  const isRestoring = useRestoreMarkdownWorkspace();
  usePersistMarkdownSession({ enabled: !isRestoring });

  return null;
};
