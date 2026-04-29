import { useEffect } from 'react';
import { papersTnetApi } from '../papersTnetApi';
import { usePapersDispatch } from '../storeHooks';
import { setPapersError, setPaperTags } from './papersSlice';

export const usePaperTagsLoader = (activeLibraryRoot: string): void => {
  const dispatch = usePapersDispatch();

  useEffect(() => {
    let canceled = false;

    const loadTags = async (): Promise<void> => {
      if (!activeLibraryRoot) {
        dispatch(setPaperTags([]));
        return;
      }

      try {
        const tags = await papersTnetApi.papers.tags.list({ libraryRoot: activeLibraryRoot });
        if (!canceled) dispatch(setPaperTags(tags));
      } catch (loadError) {
        console.error('Failed to load paper tags', loadError);
        if (!canceled) dispatch(setPapersError('Failed to load paper tags.'));
      }
    };

    void loadTags();

    return () => {
      canceled = true;
    };
  }, [activeLibraryRoot, dispatch]);
};
