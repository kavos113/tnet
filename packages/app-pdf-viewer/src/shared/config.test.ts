import { describe, expect, it } from 'vitest';
import {
  defaultPdfDocumentViewState,
  normalizeColumns,
  normalizePdfDocumentViewState,
  normalizePdfViewerGlobalSettings
} from './config';

describe('PDF viewer config', () => {
  it('normalizes global settings with bounded columns and scale', () => {
    expect(
      normalizePdfViewerGlobalSettings({
        defaultZoomMode: 'custom',
        defaultCustomScale: 99,
        defaultColumns: 100,
        overscanPages: -1,
        workspaceRoots: ['C:/docs', 'C:/docs', 42],
        activeWorkspaceRoot: 'C:/docs',
        officeConverterKind: 'libreoffice',
        officeConverterPath: 'C:/Program Files/LibreOffice/program/soffice.exe',
        officeConverterTimeoutMs: 999999,
        officePreviewCacheDir: 'C:/cache'
      })
    ).toEqual({
      defaultZoomMode: 'custom',
      defaultCustomScale: 8,
      defaultColumns: 24,
      overscanPages: 0,
      workspaceRoots: ['C:/docs'],
      activeWorkspaceRoot: 'C:/docs',
      officeConverterKind: 'libreoffice',
      officeConverterPath: 'C:/Program Files/LibreOffice/program/soffice.exe',
      officeConverterTimeoutMs: 300000,
      officePreviewCacheDir: 'C:/cache'
    });
  });

  it('normalizes per-document view state', () => {
    expect(
      normalizePdfDocumentViewState({
        zoomMode: 'bad',
        customScale: 0,
        columns: 0,
        scrollTop: -10
      })
    ).toEqual({
      ...defaultPdfDocumentViewState(),
      customScale: 0.1
    });
    expect(normalizeColumns(4.4)).toBe(4);
  });
});
