import { describe, expect, it } from 'vitest';
import { defaultGlobalConfig } from '@tnet/shared/types/config';
import {
  defaultRssGlobalConfig,
  defaultRssGlobalSettings,
  getRssGlobalConfig,
  getRssGlobalSettings,
  normalizeRssGlobalConfig,
  normalizeRssGlobalSettings,
  withRssGlobalSettings
} from './config';

describe('normalizeRssGlobalSettings', () => {
  it('keeps valid values and clamps invalid numeric values', () => {
    const settings = normalizeRssGlobalSettings({
      syncIntervalMinutes: 1,
      fetchTimeoutSeconds: 999,
      retentionDays: Number.NaN,
      defaultFilter: 'all',
      syncOnStartup: false,
      itemSummaryLineClamp: 99,
      fontFamily: '  ',
      fontSizePx: 4,
      lineHeight: 9
    });

    const defaults = defaultRssGlobalSettings();
    expect(settings.syncIntervalMinutes).toBe(5);
    expect(settings.fetchTimeoutSeconds).toBe(120);
    expect(settings.retentionDays).toBe(defaults.retentionDays);
    expect(settings.defaultFilter).toBe('all');
    expect(settings.syncOnStartup).toBe(false);
    expect(settings.itemSummaryLineClamp).toBe(8);
    expect(settings.fontFamily).toBe(defaults.fontFamily);
    expect(settings.fontSizePx).toBe(11);
    expect(settings.lineHeight).toBe(2);
  });

  it('falls back to defaults when settings are missing', () => {
    expect(normalizeRssGlobalSettings(undefined)).toEqual(defaultRssGlobalSettings());
    expect(normalizeRssGlobalConfig(undefined)).toEqual(defaultRssGlobalConfig());
  });

  it('keeps valid custom values and floors integer values', () => {
    const settings = normalizeRssGlobalSettings({
      syncIntervalMinutes: 45.8,
      fetchTimeoutSeconds: 15.9,
      retentionDays: 30.7,
      defaultFilter: 'unread',
      markReadOnOpen: false,
      confirmExternalLinks: true,
      itemSummaryLineClamp: 4.9,
      fontFamily: '  Inter  ',
      fontSizePx: 16.4,
      lineHeight: 1.75
    });

    expect(settings).toMatchObject({
      syncIntervalMinutes: 45,
      fetchTimeoutSeconds: 15,
      retentionDays: 30,
      defaultFilter: 'unread',
      markReadOnOpen: false,
      confirmExternalLinks: true,
      itemSummaryLineClamp: 4,
      fontFamily: 'Inter',
      fontSizePx: 16,
      lineHeight: 1.75
    });
  });

  it('reads and writes rss settings through the global config apps slot', () => {
    const globalConfig = defaultGlobalConfig();
    expect(getRssGlobalConfig(globalConfig)).toEqual(defaultRssGlobalConfig());

    const next = withRssGlobalSettings(globalConfig, {
      ...defaultRssGlobalSettings(),
      defaultFilter: 'all',
      fontFamily: '  Arial  ',
      syncIntervalMinutes: 2
    });

    expect(getRssGlobalSettings(next)).toMatchObject({
      defaultFilter: 'all',
      fontFamily: 'Arial',
      syncIntervalMinutes: 5
    });
  });
});
