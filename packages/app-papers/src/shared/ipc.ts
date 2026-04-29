import type { PapersGlobalConfig, PapersLibraryConfig } from './config';

export const papersIpcChannels = {
  config: {
    loadGlobal: 'papers:config:loadGlobal',
    saveGlobal: 'papers:config:saveGlobal',
    loadLibrary: 'papers:config:loadLibrary',
    saveLibrary: 'papers:config:saveLibrary'
  }
} as const;

export interface PapersApi {
  papers: {
    config: {
      loadGlobal: () => Promise<PapersGlobalConfig>;
      saveGlobal: (config: PapersGlobalConfig) => Promise<void>;
      loadLibrary: (libraryRoot: string) => Promise<PapersLibraryConfig>;
      saveLibrary: (libraryRoot: string, config: PapersLibraryConfig) => Promise<void>;
    };
  };
}
