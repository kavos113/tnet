import { describe, expect, it } from 'vitest';
import {
  defaultGlobalConfig,
  defaultGlobalFontSettings,
  getGlobalFontSettings,
  normalizeGlobalConfig,
  normalizeGlobalFontSettings,
  withGlobalFontSettings
} from './config';

describe('global font settings', () => {
  it('normalizes missing and invalid font settings', () => {
    const defaults = defaultGlobalFontSettings();

    expect(
      normalizeGlobalFontSettings({
        standardFontFamily: '  ',
        standardFontSize: 3,
        monospaceFontFamily: '  JetBrains Mono  ',
        monospaceFontSize: 99
      })
    ).toEqual({
      standardFontFamily: defaults.standardFontFamily,
      standardFontSize: 8,
      monospaceFontFamily: 'JetBrains Mono',
      monospaceFontSize: 48
    });
  });

  it('stores common font settings on the shell global config', () => {
    const config = withGlobalFontSettings(defaultGlobalConfig(), {
      standardFontFamily: 'Inter',
      standardFontSize: 14,
      monospaceFontFamily: 'Code Font',
      monospaceFontSize: 15
    });

    expect(getGlobalFontSettings(config)).toEqual({
      standardFontFamily: 'Inter',
      standardFontSize: 14,
      monospaceFontFamily: 'Code Font',
      monospaceFontSize: 15
    });
    expect(normalizeGlobalConfig({}).fonts).toEqual(defaultsWithFonts());
  });
});

const defaultsWithFonts = () => defaultGlobalFontSettings();
