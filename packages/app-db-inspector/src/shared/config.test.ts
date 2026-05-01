import { describe, expect, it } from 'vitest';
import {
  defaultDbInspectorWorkspaceSettings,
  getDbInspectorGlobalSettings,
  normalizeDbInspectorWorkspaceSettings,
  withDbInspectorGlobalSettings
} from './config';
import { defaultGlobalConfig } from '@tnet/shared/types/config';

describe('db inspector config', () => {
  it('normalizes invalid workspace settings', () => {
    const settings = normalizeDbInspectorWorkspaceSettings({
      defaultSchema: '  main  ',
      tablePageSize: -1,
      queryTimeoutMs: 0,
      readOnlyMode: false
    });

    expect(settings).toEqual({
      ...defaultDbInspectorWorkspaceSettings(),
      defaultSchema: 'main',
      readOnlyMode: false
    });
  });

  it('stores global settings under db-inspector app config', () => {
    const config = withDbInspectorGlobalSettings(defaultGlobalConfig(), {
      queryFontFamily: 'JetBrains Mono',
      queryFontSize: 14,
      gridFontFamily: 'Inter',
      gridFontSize: 13,
      defaultPageSize: 250
    });

    expect(getDbInspectorGlobalSettings(config).defaultPageSize).toBe(250);
    expect(config.apps?.['db-inspector']).toEqual({
      settings: {
        queryFontFamily: 'JetBrains Mono',
        queryFontSize: 14,
        gridFontFamily: 'Inter',
        gridFontSize: 13,
        defaultPageSize: 250
      }
    });
  });
});
