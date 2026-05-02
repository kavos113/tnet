import { describe, expect, it } from 'vitest';
import { defaultRssGlobalSettings, normalizeRssGlobalSettings } from './config';

describe('normalizeRssGlobalSettings', () => {
  it('keeps valid values and clamps invalid numeric values', () => {
    const settings = normalizeRssGlobalSettings({
      syncIntervalMinutes: 1,
      fetchTimeoutSeconds: 999,
      retentionDays: Number.NaN,
      defaultFilter: 'all',
      syncOnStartup: false
    });

    expect(settings.syncIntervalMinutes).toBe(5);
    expect(settings.fetchTimeoutSeconds).toBe(120);
    expect(settings.retentionDays).toBe(defaultRssGlobalSettings().retentionDays);
    expect(settings.defaultFilter).toBe('all');
    expect(settings.syncOnStartup).toBe(false);
  });
});
