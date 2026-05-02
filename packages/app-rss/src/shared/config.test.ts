import { describe, expect, it } from 'vitest';
import { defaultRssGlobalSettings, normalizeRssGlobalSettings } from './config';

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
});
