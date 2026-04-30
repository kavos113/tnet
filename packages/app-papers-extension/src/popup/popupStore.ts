import type { BibtexPaperMetadata, BibtexParseDiagnostic } from '@tnet/app-papers/shared/bibtex';
import { parseBibtexMetadataResult } from '@tnet/app-papers/shared/bibtex';
import { formatPaperImportError } from '@tnet/app-papers/shared/paperImportErrors';
import type { DirectoryNode, LibraryInfo } from '../types';
import type { PapersExtensionServerClient } from '../papersServerClient';

export type PopupStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'server-unavailable'
  | 'error'
  | 'imported';

export interface PopupState {
  status: PopupStatus;
  errorMessage?: string;
  libraries: LibraryInfo[];
  activeLibraryRoot?: string;
  selectedLibraryRoot?: string;
  selectedDirectoryPath?: string;
  directoryTree?: DirectoryNode | null;
  bibtexInput: string;
  bibtexDiagnostics: BibtexParseDiagnostic[];
  metadata: BibtexPaperMetadata;
  tagsInput: string;
  selectedPdfFileName?: string;
  selectedPdfFileSize?: number;
  importResult?: unknown;
  importStatusMessage?: string;
}

export interface DirectoryOption {
  value: string;
  label: string;
}

export const initialPopupState = (): PopupState => ({
  status: 'idle',
  libraries: [],
  bibtexInput: '',
  bibtexDiagnostics: [],
  metadata: {},
  tagsInput: ''
});

export const resolveInitialLibraryRoot = (
  libraries: LibraryInfo[],
  activeLibraryRoot?: string
): string | undefined => {
  if (activeLibraryRoot && libraries.some((library) => library.rootPath === activeLibraryRoot)) {
    return activeLibraryRoot;
  }
  return libraries[0]?.rootPath;
};

export const flattenDirectoryTree = (root: DirectoryNode | null | undefined): DirectoryOption[] => {
  if (!root) return [{ value: '', label: '/' }];

  const options: DirectoryOption[] = [{ value: '', label: '/' }];
  const visit = (node: DirectoryNode): void => {
    for (const child of node.children ?? []) {
      options.push({
        value: child.relativePath,
        label: child.relativePath || child.name
      });
      visit(child);
    }
  };
  visit(root);
  return options;
};

export const parseTagsInput = (value: string): string[] =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

export const updateBibtexInput = (state: PopupState, bibtexInput: string): PopupState => {
  const { metadata, diagnostics } = parseBibtexMetadataResult(bibtexInput);
  return {
    ...state,
    bibtexInput,
    bibtexDiagnostics: diagnostics,
    metadata,
    errorMessage: undefined
  };
};

export const updateMetadata = (state: PopupState, metadata: BibtexPaperMetadata): PopupState => ({
  ...state,
  metadata,
  errorMessage: undefined
});

export const loadPopupState = async (client: PapersExtensionServerClient): Promise<PopupState> => {
  if (!(await client.checkHealth())) {
    return {
      ...initialPopupState(),
      status: 'server-unavailable',
      errorMessage: 'TNet desktop app is not running.'
    };
  }

  try {
    const libraries = await client.listLibraries();
    const selectedLibraryRoot = resolveInitialLibraryRoot(
      libraries.libraries,
      libraries.activeLibraryRoot
    );
    const directoryTree = selectedLibraryRoot
      ? await client.listDirectories(selectedLibraryRoot)
      : null;

    return {
      ...initialPopupState(),
      status: 'ready',
      libraries: libraries.libraries,
      activeLibraryRoot: libraries.activeLibraryRoot,
      selectedLibraryRoot,
      selectedDirectoryPath: '',
      directoryTree
    };
  } catch (error) {
    return {
      ...initialPopupState(),
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Failed to load paper import state.'
    };
  }
};

export const selectLibrary = async (
  client: PapersExtensionServerClient,
  state: PopupState,
  libraryRoot: string
): Promise<PopupState> => ({
  ...state,
  status: 'ready',
  selectedLibraryRoot: libraryRoot,
  selectedDirectoryPath: '',
  directoryTree: libraryRoot ? await client.listDirectories(libraryRoot) : null,
  errorMessage: undefined
});

export const importSelectedPaper = async (
  client: PapersExtensionServerClient,
  state: PopupState,
  pdfFile: { name: string; bytes: Uint8Array<ArrayBuffer> } | null
): Promise<PopupState> => {
  if (!state.selectedLibraryRoot) {
    return {
      ...state,
      status: 'error',
      errorMessage: 'Select a paper library before importing.'
    };
  }
  if (!pdfFile) {
    return {
      ...state,
      status: 'error',
      errorMessage: 'Select a downloaded PDF before importing.'
    };
  }

  try {
    const importResult = await client.createPaperFromPdfBytes({
      libraryRoot: state.selectedLibraryRoot,
      directoryPath: state.selectedDirectoryPath ?? '',
      fileName: pdfFile.name,
      pdfBytes: pdfFile.bytes,
      metadata: state.metadata
    });
    return {
      ...state,
      status: 'imported',
      importResult,
      importStatusMessage: 'Import complete.',
      errorMessage: undefined
    };
  } catch (error) {
    return {
      ...state,
      status: 'error',
      errorMessage: formatPaperImportError(error)
    };
  }
};
