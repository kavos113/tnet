import { useEffect } from 'react';
import { usePapersDispatch } from '../storeHooks';
import { papersTnetApi } from '../papersTnetApi';
import { setPaperDetail, setPapersDetailLoading, setPapersError } from './papersSlice';

export const usePaperDetailLoader = (activeLibraryRoot: string, selectedPaperId: string): void => {
  const dispatch = usePapersDispatch();

  useEffect(() => {
    let canceled = false;

    const loadDetail = async (): Promise<void> => {
      if (!activeLibraryRoot || !selectedPaperId) return;
      dispatch(setPapersDetailLoading(true));
      try {
        const paper = await papersTnetApi.papers.papers.get({
          libraryRoot: activeLibraryRoot,
          paperId: selectedPaperId
        });
        if (!canceled) dispatch(setPaperDetail(paper));
      } catch (loadError) {
        console.error('Failed to load paper detail', loadError);
        if (!canceled) dispatch(setPapersError('Failed to load paper detail.'));
      } finally {
        if (!canceled) dispatch(setPapersDetailLoading(false));
      }
    };

    void loadDetail();

    return () => {
      canceled = true;
    };
  }, [activeLibraryRoot, dispatch, selectedPaperId]);
};
