import { useEffect, useState } from 'react';
import { normalizeGlobalConfig } from '@tnet/shared/types/config';
import { getPapersGlobalSettings } from '@tnet/app-papers/shared/config';
import { usePapersDispatch } from '@tnet/app-papers/renderer/storeHooks';
import {
  markPapersLibraryRestored,
  restorePapersLibrary,
  setPapersGlobalSettings
} from './librarySlice';
import { papersTnetApi } from '../papersTnetApi';

export const useRestorePapersLibrary = (): boolean => {
  const dispatch = usePapersDispatch();
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    let canceled = false;

    const restoreLibrary = async (): Promise<void> => {
      const [shellConfig, config] = await Promise.all([
        papersTnetApi.config.loadGlobal(),
        papersTnetApi.papers.config.loadGlobal()
      ]);
      const globalSettings = getPapersGlobalSettings(normalizeGlobalConfig(shellConfig));
      dispatch(setPapersGlobalSettings(globalSettings));
      const libraryRoot = config.activeLibraryRoot ?? config.lastOpenedDirectory ?? '';
      const [settings, directoryTree] = libraryRoot
        ? await Promise.all([
            papersTnetApi.papers.config.loadLibrary(libraryRoot),
            papersTnetApi.workspace.getFileTree(libraryRoot)
          ])
        : [undefined, []];

      if (canceled) return;
      if (!libraryRoot) {
        dispatch(markPapersLibraryRestored());
        return;
      }

      dispatch(
        restorePapersLibrary({
          libraryRoots: config.libraryRoots,
          activeLibraryRoot: libraryRoot,
          directoryTree,
          settings,
          globalSettings
        })
      );
    };

    restoreLibrary()
      .catch((error: unknown) => {
        console.error('Failed to restore papers library', error);
        if (!canceled) dispatch(markPapersLibraryRestored());
      })
      .finally(() => {
        if (!canceled) setIsRestoring(false);
      });

    return () => {
      canceled = true;
    };
  }, [dispatch]);

  return isRestoring;
};
