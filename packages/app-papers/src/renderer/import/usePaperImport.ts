import { useState } from 'react';
import type { BibtexPaperMetadata, BibtexParseDiagnostic } from '@tnet/app-papers/shared/bibtex';
import { parseBibtexMetadataResult } from '@tnet/app-papers/shared/bibtex';
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
  importBibtex: string;
  importBibtexDiagnostics: BibtexParseDiagnostic[];
  importMetadata: BibtexPaperMetadata;
  importTitle: string;
  setImportBibtex: (bibtex: string) => void;
  setImportMetadata: (metadata: BibtexPaperMetadata) => void;
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
  const [importBibtex, setImportBibtexState] = useState('');
  const [importBibtexDiagnostics, setImportBibtexDiagnostics] = useState<BibtexParseDiagnostic[]>(
    []
  );
  const [importMetadata, setImportMetadata] = useState<BibtexPaperMetadata>({});
  const [importTitle, setImportTitle] = useState('');

  const setImportBibtex = (bibtex: string): void => {
    setImportBibtexState(bibtex);
    const { metadata, diagnostics } = parseBibtexMetadataResult(bibtex);
    setImportBibtexDiagnostics(diagnostics);
    setImportMetadata(metadata);
    if (metadata.title) {
      setImportTitle(metadata.title);
    }
  };

  const importPdf = async (): Promise<void> => {
    if (!activeLibraryRoot) return;

    const candidate = await papersTnetApi.papers.library.selectPdf({
      libraryRoot: activeLibraryRoot,
      directoryPath: selectedDirectoryRelativePath
    });
    if (!candidate) return;

    setImportCandidate(candidate);
    const { metadata, diagnostics } = parseBibtexMetadataResult(candidate.clipboardBibtex ?? '');
    setImportBibtexState(candidate.clipboardBibtex ?? '');
    setImportBibtexDiagnostics(diagnostics);
    setImportMetadata(metadata);
    setImportTitle(metadata.title ?? candidate.suggestedTitle);
  };

  const confirmImportPdf = async (): Promise<void> => {
    if (!activeLibraryRoot || !importCandidate) return;

    const title = importTitle.trim();
    if (!title) return;

    const imported = await papersTnetApi.papers.library.createPaperFromPdf({
      libraryRoot: activeLibraryRoot,
      sourcePath: importCandidate.sourcePath,
      title,
      authors: importMetadata.authors,
      abstract: importMetadata.abstract,
      publishedYear: importMetadata.publishedYear,
      venue: importMetadata.venue,
      doi: importMetadata.doi,
      arxivId: importMetadata.arxivId,
      url: importMetadata.url,
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
    setImportBibtexState('');
    setImportBibtexDiagnostics([]);
    setImportMetadata({});
    setImportTitle('');
  };

  const cancelImportPdf = (): void => {
    setImportCandidate(null);
    setImportBibtexState('');
    setImportBibtexDiagnostics([]);
    setImportMetadata({});
    setImportTitle('');
    dispatch(setPapersError(''));
  };

  return {
    importCandidate,
    importBibtex,
    importBibtexDiagnostics,
    importMetadata,
    importTitle,
    setImportBibtex,
    setImportMetadata,
    setImportTitle,
    importPdf,
    confirmImportPdf,
    cancelImportPdf
  };
};
