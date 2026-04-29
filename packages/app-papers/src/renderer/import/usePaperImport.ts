import { useState } from 'react';
import type { SelectedPdfImportCandidate } from '@tnet/app-papers/shared/ipc';
import { usePapersDispatch } from '../storeHooks';
import { papersTnetApi } from '../papersTnetApi';
import {
  selectPaper,
  setActivePapersDetailTab,
  setPaperDetail,
  setPapers,
  setPapersError
} from '../papers/papersSlice';

export interface PaperImportState {
  importCandidate: SelectedPdfImportCandidate | null;
  importTitle: string;
  setImportTitle: (title: string) => void;
  importPdf: () => Promise<void>;
  confirmImportPdf: () => Promise<void>;
  cancelImportPdf: () => void;
}

export const usePaperImport = ({
  activeLibraryRoot,
  selectedDirectoryRelativePath
}: {
  activeLibraryRoot: string;
  selectedDirectoryRelativePath: string | undefined;
}): PaperImportState => {
  const dispatch = usePapersDispatch();
  const [importCandidate, setImportCandidate] = useState<SelectedPdfImportCandidate | null>(null);
  const [importTitle, setImportTitle] = useState('');

  const importPdf = async (): Promise<void> => {
    if (!activeLibraryRoot) return;

    const candidate = await papersTnetApi.papers.library.selectPdf({
      libraryRoot: activeLibraryRoot,
      directoryPath: selectedDirectoryRelativePath
    });
    if (!candidate) return;

    setImportCandidate(candidate);
    setImportTitle(candidate.suggestedTitle);
  };

  const confirmImportPdf = async (): Promise<void> => {
    if (!activeLibraryRoot || !importCandidate) return;

    const title = importTitle.trim();
    if (!title) return;

    const imported = await papersTnetApi.papers.library.createPaperFromPdf({
      libraryRoot: activeLibraryRoot,
      sourcePath: importCandidate.sourcePath,
      title,
      directoryPath: importCandidate.targetDirectoryPath
    });
    const papers = await papersTnetApi.papers.papers.list({
      libraryRoot: activeLibraryRoot,
      directoryPath: selectedDirectoryRelativePath
    });

    dispatch(setPapers(papers));
    dispatch(selectPaper(imported.id));
    dispatch(setPaperDetail(imported));
    dispatch(setActivePapersDetailTab('pdf'));
    setImportCandidate(null);
    setImportTitle('');
  };

  const cancelImportPdf = (): void => {
    setImportCandidate(null);
    setImportTitle('');
    dispatch(setPapersError(''));
  };

  return {
    importCandidate,
    importTitle,
    setImportTitle,
    importPdf,
    confirmImportPdf,
    cancelImportPdf
  };
};
