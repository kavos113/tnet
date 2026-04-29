import { useCallback, useEffect, useRef } from 'react';
import { usePapersDispatch, usePapersSelector } from '../storeHooks';
import { papersTnetApi } from '../papersTnetApi';
import { setPapersLibrary } from './librarySlice';

export const usePapersLibrarySwitcher = (): {
  openLibrary: () => Promise<void>;
  switchLibrary: (libraryRoot: string) => Promise<void>;
} => {
  const dispatch = usePapersDispatch();
  const libraryRoots = usePapersSelector((state) => state.papersLibrary.libraryRoots);
  const libraryRootsRef = useRef(libraryRoots);

  useEffect(() => {
    libraryRootsRef.current = libraryRoots;
  }, [libraryRoots]);

  const switchLibrary = useCallback(
    async (libraryRoot: string): Promise<void> => {
      if (!libraryRoot) return;

      const nextLibraryRoots = Array.from(new Set([...libraryRootsRef.current, libraryRoot]));
      const settings = await papersTnetApi.papers.config.loadLibrary(libraryRoot);

      dispatch(
        setPapersLibrary({
          libraryRoots: nextLibraryRoots,
          activeLibraryRoot: libraryRoot,
          settings
        })
      );

      await papersTnetApi.papers.config.saveGlobal({
        libraryRoots: nextLibraryRoots,
        activeLibraryRoot: libraryRoot,
        lastOpenedDirectory: libraryRoot
      });
    },
    [dispatch]
  );

  const openLibrary = useCallback(async (): Promise<void> => {
    const result = await papersTnetApi.workspace.openDirectory();
    if (!result.rootPath) return;

    await switchLibrary(result.rootPath);
  }, [switchLibrary]);

  return { openLibrary, switchLibrary };
};
