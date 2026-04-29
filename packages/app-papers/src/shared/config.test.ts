import { describe, expect, it } from 'vitest';
import { defaultGlobalConfig } from '@tnet/shared/types/config';
import {
  defaultPapersGlobalConfig,
  defaultPapersLibraryConfig,
  getPapersGlobalConfig,
  normalizePapersLibraryConfig,
  withPapersGlobalConfig
} from './config';

describe('papers config', () => {
  it('reads and writes papers global config through GlobalConfig apps slot', () => {
    const globalConfig = defaultGlobalConfig();
    expect(getPapersGlobalConfig(globalConfig)).toEqual(defaultPapersGlobalConfig());

    const nextGlobalConfig = withPapersGlobalConfig(globalConfig, {
      libraryRoots: ['/papers'],
      activeLibraryRoot: '/papers',
      lastOpenedDirectory: '/papers'
    });

    expect(getPapersGlobalConfig(nextGlobalConfig)).toEqual({
      libraryRoots: ['/papers'],
      activeLibraryRoot: '/papers',
      lastOpenedDirectory: '/papers'
    });
  });

  it('normalizes library config with defaults', () => {
    expect(normalizePapersLibraryConfig({ listDensity: 'compact' })).toEqual({
      ...defaultPapersLibraryConfig(),
      listDensity: 'compact'
    });
  });
});
