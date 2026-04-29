import type {
  BrowserDetectedPaperSource,
  BrowserPaperImportCandidate,
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
  candidate?: BrowserPaperImportCandidate;
}

export const initialPopupState = (): PopupState => ({
  status: 'idle',
  libraries: []
});

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

    return {
      status: 'ready',
      libraries: libraries.libraries,
      activeLibraryRoot: libraries.activeLibraryRoot,
      candidate
    };
  } catch (error) {
    return {
      ...initialPopupState(),
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Failed to load paper import state.'
    };
  }
};
