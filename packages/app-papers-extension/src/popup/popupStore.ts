import type {
  BrowserDetectedPaperSource,
  BrowserPaperImportCandidate,
  DirectoryNode,
  ImportBrowserPaperResponse,
  LibraryInfo
} from '../types';
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
  candidate?: BrowserPaperImportCandidate;
  importPdf: boolean;
  tagsInput: string;
  importResult?: ImportBrowserPaperResponse;
}

export interface DirectoryOption {
  value: string;
  label: string;
}

export const initialPopupState = (): PopupState => ({
  status: 'idle',
  libraries: [],
  importPdf: false,
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

export const loadPopupState = async (
  client: PapersExtensionServerClient,
  source: BrowserDetectedPaperSource
): Promise<PopupState> => {
  if (!(await client.checkHealth())) {
    return {
      ...initialPopupState(),
      status: 'server-unavailable',
      errorMessage: 'TNet desktop app is not running.'
    };
  }

  try {
    const [libraries, candidate] = await Promise.all([
      client.listLibraries(),
      client.resolveMetadata(source)
    ]);
    const selectedLibraryRoot = resolveInitialLibraryRoot(
      libraries.libraries,
      libraries.activeLibraryRoot
    );
    const directoryTree = selectedLibraryRoot
      ? await client.listDirectories(selectedLibraryRoot)
      : null;

    return {
      status: 'ready',
      libraries: libraries.libraries,
      activeLibraryRoot: libraries.activeLibraryRoot,
      selectedLibraryRoot,
      selectedDirectoryPath: '',
      directoryTree,
      candidate,
      importPdf: Boolean(candidate.pdfUrl),
      tagsInput: candidate.tags?.join(', ') ?? ''
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
  state: PopupState
): Promise<PopupState> => {
  if (!state.selectedLibraryRoot || !state.candidate) {
    return {
      ...state,
      status: 'error',
      errorMessage: 'Select a paper library before importing.'
    };
  }

  try {
    const importResult = await client.importPaper({
      libraryRoot: state.selectedLibraryRoot,
      directoryPath: state.selectedDirectoryPath ?? '',
      candidate: state.candidate,
      importPdf: state.importPdf && Boolean(state.candidate.pdfUrl),
      tags: parseTagsInput(state.tagsInput)
    });
    return {
      ...state,
      status: 'imported',
      importResult,
      errorMessage: undefined
    };
  } catch (error) {
    return {
      ...state,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Failed to import paper.'
    };
  }
};
