import fs from 'fs/promises';
import type { GlobalConfig } from '@tnet/shared/types/config';
import { readJsonFileOrDefault, writeJsonFile } from '@tnet/main-core/storage/jsonFile';
import {
  defaultPapersLibraryConfig,
  getPapersGlobalConfig,
  normalizePapersLibraryConfig,
  type PapersGlobalConfig,
  type PapersLibraryConfig,
  withPapersGlobalConfig
} from '@tnet/app-papers/shared/config';
import { papersDataDir, papersSettingsPath } from './papersPaths';

export interface PapersGlobalConfigStore {
  loadGlobalConfig: () => Promise<GlobalConfig>;
  saveGlobalConfig: (config: GlobalConfig) => Promise<void>;
}

export const loadPapersGlobalConfig = async (
  store: PapersGlobalConfigStore
): Promise<PapersGlobalConfig> => {
  const globalConfig = await store.loadGlobalConfig();
  return getPapersGlobalConfig(globalConfig);
};

export const savePapersGlobalConfig = async (
  store: PapersGlobalConfigStore,
  papersConfig: PapersGlobalConfig
): Promise<void> => {
  const globalConfig = await store.loadGlobalConfig();
  await store.saveGlobalConfig(withPapersGlobalConfig(globalConfig, papersConfig));
};

export const loadPapersLibraryConfig = async (
  libraryRoot: string
): Promise<PapersLibraryConfig> => {
  if (!libraryRoot) return defaultPapersLibraryConfig();

  return normalizePapersLibraryConfig(
    await readJsonFileOrDefault<Partial<PapersLibraryConfig>>(
      papersSettingsPath(libraryRoot),
      defaultPapersLibraryConfig()
    )
  );
};

export const savePapersLibraryConfig = async (
  libraryRoot: string,
  config: PapersLibraryConfig
): Promise<void> => {
  if (!libraryRoot) return;
  await fs.mkdir(papersDataDir(libraryRoot), { recursive: true });
  await writeJsonFile(papersSettingsPath(libraryRoot), normalizePapersLibraryConfig(config));
};
