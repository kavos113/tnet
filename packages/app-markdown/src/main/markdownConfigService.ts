import { readJsonFileOrDefault, writeJsonFile } from '@tnet/main-core/storage/jsonFile';
import { settingsFilePath } from '@tnet/main-core/storage/paths';
import type { MarkdownProjectConfig } from '@tnet/app-markdown/shared/config';
import {
  defaultMarkdownProjectConfig,
  normalizeMarkdownProjectConfig
} from '@tnet/app-markdown/shared/config';

export const loadMarkdownProjectConfig = async (
  rootDir: string
): Promise<MarkdownProjectConfig> => {
  if (!rootDir) return defaultMarkdownProjectConfig();

  return normalizeMarkdownProjectConfig(
    await readJsonFileOrDefault<Partial<MarkdownProjectConfig>>(settingsFilePath(rootDir), {})
  );
};

export const saveMarkdownProjectConfig = async (
  rootDir: string,
  config: MarkdownProjectConfig
): Promise<void> => {
  await writeJsonFile(settingsFilePath(rootDir), normalizeMarkdownProjectConfig(config));
};
