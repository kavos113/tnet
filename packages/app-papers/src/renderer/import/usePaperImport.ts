import { useState } from 'react';
import type { BibtexPaperMetadata, BibtexParseDiagnostic } from '@tnet/app-papers/shared/bibtex';
import { parseBibtexMetadataResult } from '@tnet/app-papers/shared/bibtex';
import type { SelectedPdfImportCandidate } from '@tnet/app-papers/shared/ipc';
import { formatPaperImportError } from '@tnet/app-papers/shared/paperImportErrors';
import { usePapersDispatch } from '../storeHooks';
import { papersTnetApi } from '../papersTnetApi';
import {
  selectPaper,
  setActivePapersDetailTab,
  setPaperDetail,
  setPapers,
  setPapersError
} from '../papers/papersSlice';

export type PaperImportMetadataField =
  | 'authors'
  | 'abstract'
  | 'publishedYear'
  | 'venue'
  | 'doi'
  | 'arxivId'
  | 'url';
export type PaperImportDirtyField = PaperImportMetadataField | 'title';
export type PaperImportDirtyFields = Partial<Record<PaperImportDirtyField, true>>;

export interface PaperImportState {
  importCandidate: SelectedPdfImportCandidate | null;
  importBibtex: string;
  importBibtexDiagnostics: BibtexParseDiagnostic[];
  importError: string;
  importMetadata: BibtexPaperMetadata;
  importTitle: string;
  setImportBibtex: (bibtex: string) => void;
  setImportMetadataField: <Field extends PaperImportMetadataField>(
    field: Field,
    value: BibtexPaperMetadata[Field]
  ) => void;
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
  const [importError, setImportError] = useState('');
  const [importMetadata, setImportMetadata] = useState<BibtexPaperMetadata>({});
  const [importTitle, setImportTitle] = useState('');
  const [dirtyFields, setDirtyFields] = useState<PaperImportDirtyFields>({});

  const setImportBibtex = (bibtex: string): void => {
    setImportBibtexState(bibtex);
    setImportError('');
    const { metadata, diagnostics } = parseBibtexMetadataResult(bibtex);
    const merged = mergeBibtexMetadata({
      currentMetadata: importMetadata,
      currentTitle: importTitle,
      dirtyFields,
      parsedMetadata: metadata
    });
    setImportBibtexDiagnostics(diagnostics);
    setImportMetadata(merged.metadata);
    setImportTitle(merged.title);
  };

  const setImportMetadataField = <Field extends PaperImportMetadataField>(
    field: Field,
    value: BibtexPaperMetadata[Field]
  ): void => {
    setDirtyFields((current) => ({ ...current, [field]: true }));
    setImportError('');
    setImportMetadata((current) => ({ ...current, [field]: value }));
  };

  const setDirtyImportTitle = (title: string): void => {
    setDirtyFields((current) => ({ ...current, title: true }));
    setImportError('');
    setImportTitle(title);
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
    setImportError('');
    setDirtyFields({});
  };

  const confirmImportPdf = async (): Promise<void> => {
    if (!activeLibraryRoot || !importCandidate) return;

    const title = importTitle.trim();
    if (!title) return;

    let imported;
    let papers;
    try {
      imported = await papersTnetApi.papers.library.createPaperFromPdf({
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
      papers = await papersTnetApi.papers.papers.list({
        libraryRoot: activeLibraryRoot,
        directoryPath: selectedDirectoryRelativePath
      });
    } catch (error) {
      setImportError(formatPaperImportError(error));
      throw error;
    }

    dispatch(setPapers(papers));
    dispatch(selectPaper(imported.id));
    dispatch(setPaperDetail(imported));
    dispatch(setActivePapersDetailTab('pdf'));
    setImportCandidate(null);
    setImportBibtexState('');
    setImportBibtexDiagnostics([]);
    setImportError('');
    setImportMetadata({});
    setImportTitle('');
    setDirtyFields({});
  };

  const cancelImportPdf = (): void => {
    setImportCandidate(null);
    setImportBibtexState('');
    setImportBibtexDiagnostics([]);
    setImportError('');
    setImportMetadata({});
    setImportTitle('');
    setDirtyFields({});
    dispatch(setPapersError(''));
  };

  return {
    importCandidate,
    importBibtex,
    importBibtexDiagnostics,
    importError,
    importMetadata,
    importTitle,
    setImportBibtex,
    setImportMetadataField,
    setImportTitle: setDirtyImportTitle,
    importPdf,
    confirmImportPdf,
    cancelImportPdf
  };
};

export const mergeBibtexMetadata = ({
  currentMetadata,
  currentTitle,
  dirtyFields,
  parsedMetadata
}: {
  currentMetadata: BibtexPaperMetadata;
  currentTitle: string;
  dirtyFields: PaperImportDirtyFields;
  parsedMetadata: BibtexPaperMetadata;
}): { metadata: BibtexPaperMetadata; title: string } => {
  const nextMetadata: BibtexPaperMetadata = { ...currentMetadata };
  const fields: PaperImportMetadataField[] = [
    'authors',
    'abstract',
    'publishedYear',
    'venue',
    'doi',
    'arxivId',
    'url'
  ];

  for (const field of fields) {
    if (!dirtyFields[field]) {
      nextMetadata[field] = parsedMetadata[field] as never;
    }
  }

  return {
    metadata: Object.fromEntries(
      Object.entries(nextMetadata).filter(([, value]) =>
        Array.isArray(value) ? value.length > 0 : value !== undefined && value !== ''
      )
    ) as BibtexPaperMetadata,
    title: dirtyFields.title ? currentTitle : (parsedMetadata.title ?? currentTitle)
  };
};
