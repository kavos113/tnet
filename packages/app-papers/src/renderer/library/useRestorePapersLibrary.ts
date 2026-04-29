import { useEffect, useState } from 'react';
import { usePapersDispatch } from '@tnet/app-papers/renderer/storeHooks';
import { markPapersLibraryRestored, restorePapersLibrary } from './librarySlice';
import { papersTnetApi } from '../papersTnetApi';

export const useRestorePapersLibrary = (): boolean => {
  const dispatch = usePapersDispatch();
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    let canceled = false;

    const restoreLibrary = async (): Promise<void> => {
      const config = await papersTnetApi.papers.config.loadGlobal();
      const libraryRoot = config.activeLibraryRoot ?? config.lastOpenedDirectory ?? '';
      const settings = libraryRoot
        ? await papersTnetApi.papers.config.loadLibrary(libraryRoot)
        : undefined;

      if (canceled) return;
      if (!libraryRoot) {
        dispatch(markPapersLibraryRestored());
        return;
      }

      dispatch(
        restorePapersLibrary({
          libraryRoots: config.libraryRoots,
          activeLibraryRoot: libraryRoot,
          settings
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
