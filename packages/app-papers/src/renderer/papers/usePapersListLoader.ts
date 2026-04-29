import { useEffect } from 'react';
import { usePapersDispatch } from '../storeHooks';
import { papersTnetApi } from '../papersTnetApi';
import { setPapers, setPapersError, setPapersListLoading } from './papersSlice';

export const usePapersListLoader = (
  activeLibraryRoot: string,
  selectedDirectoryRelativePath: string | undefined,
  searchQuery: string,
  selectedTagIds: string[]
): void => {
  const dispatch = usePapersDispatch();

  useEffect(() => {
    let canceled = false;

    const loadPapers = async (): Promise<void> => {
      if (!activeLibraryRoot) return;
      dispatch(setPapersListLoading(true));
      dispatch(setPapersError(''));
      try {
        const papers = await papersTnetApi.papers.papers.list({
          libraryRoot: activeLibraryRoot,
          directoryPath: selectedDirectoryRelativePath,
          query: searchQuery,
          tagIds: selectedTagIds
        });
        if (!canceled) dispatch(setPapers(papers));
      } catch (loadError) {
        console.error('Failed to load papers', loadError);
        if (!canceled) dispatch(setPapersError('Failed to load papers.'));
      } finally {
        if (!canceled) dispatch(setPapersListLoading(false));
      }
    };

    void loadPapers();

    return () => {
      canceled = true;
    };
  }, [activeLibraryRoot, dispatch, searchQuery, selectedDirectoryRelativePath, selectedTagIds]);
};
