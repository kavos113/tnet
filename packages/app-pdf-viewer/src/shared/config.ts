import type { GlobalConfig } from '@tnet/shared/types/config';
import type { PdfDocumentViewState, PdfZoomMode } from './pdfViewerTypes';

export interface PdfViewerGlobalSettings {
  defaultZoomMode: PdfZoomMode;
  defaultCustomScale: number;
  defaultColumns: number;
  overscanPages: number;
  workspaceRoots: string[];
  activeWorkspaceRoot?: string;
  officeConverterKind: 'none' | 'libreoffice';
  officeConverterPath: string;
  officeConverterTimeoutMs: number;
  officePreviewCacheDir: string;
}

const appId = 'pdf-viewer';

export const defaultPdfDocumentViewState = (): PdfDocumentViewState => ({
  zoomMode: 'page-width',
  customScale: 1,
  columns: 1,
  scrollTop: 0
});

export const defaultPdfViewerGlobalSettings = (): PdfViewerGlobalSettings => ({
  defaultZoomMode: 'page-width',
  defaultCustomScale: 1,
  defaultColumns: 1,
  overscanPages: 2,
  workspaceRoots: [],
  officeConverterKind: 'none',
  officeConverterPath: '',
  officeConverterTimeoutMs: 30000,
  officePreviewCacheDir: ''
});

export const normalizePdfViewerGlobalSettings = (value: unknown): PdfViewerGlobalSettings => {
  const defaults = defaultPdfViewerGlobalSettings();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaults;
  const candidate = value as Partial<PdfViewerGlobalSettings>;
  return {
    defaultZoomMode: normalizeZoomMode(candidate.defaultZoomMode, defaults.defaultZoomMode),
    defaultCustomScale: normalizeScale(candidate.defaultCustomScale, defaults.defaultCustomScale),
    defaultColumns: normalizeColumns(candidate.defaultColumns, defaults.defaultColumns),
    overscanPages: normalizeInteger(candidate.overscanPages, defaults.overscanPages, 0, 20),
    workspaceRoots: normalizeStringArray(candidate.workspaceRoots),
    activeWorkspaceRoot:
      typeof candidate.activeWorkspaceRoot === 'string' ? candidate.activeWorkspaceRoot : undefined,
    officeConverterKind:
      candidate.officeConverterKind === 'libreoffice'
        ? 'libreoffice'
        : defaults.officeConverterKind,
    officeConverterPath:
      typeof candidate.officeConverterPath === 'string'
        ? candidate.officeConverterPath
        : defaults.officeConverterPath,
    officeConverterTimeoutMs: normalizeInteger(
      candidate.officeConverterTimeoutMs,
      defaults.officeConverterTimeoutMs,
      1000,
      300000
    ),
    officePreviewCacheDir:
      typeof candidate.officePreviewCacheDir === 'string'
        ? candidate.officePreviewCacheDir
        : defaults.officePreviewCacheDir
  };
};

export const getPdfViewerGlobalSettings = (config: GlobalConfig): PdfViewerGlobalSettings =>
  normalizePdfViewerGlobalSettings(config.apps?.[appId]);

export const withPdfViewerGlobalSettings = (
  config: GlobalConfig,
  settings: PdfViewerGlobalSettings
): GlobalConfig => ({
  ...config,
  apps: {
    ...config.apps,
    [appId]: normalizePdfViewerGlobalSettings(settings)
  }
});

export const normalizePdfDocumentViewState = (
  value: unknown,
  defaults: PdfDocumentViewState = defaultPdfDocumentViewState()
): PdfDocumentViewState => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaults;
  const candidate = value as Partial<PdfDocumentViewState>;
  return {
    zoomMode: normalizeZoomMode(candidate.zoomMode, defaults.zoomMode),
    customScale: normalizeScale(candidate.customScale, defaults.customScale),
    columns: normalizeColumns(candidate.columns, defaults.columns),
    scrollTop: normalizeInteger(candidate.scrollTop, defaults.scrollTop, 0, Number.MAX_SAFE_INTEGER)
  };
};

export const normalizeColumns = (value: unknown, fallback = 1): number =>
  normalizeInteger(value, fallback, 1, 24);

const normalizeZoomMode = (value: unknown, fallback: PdfZoomMode): PdfZoomMode =>
  value === 'page-width' || value === 'page-fit' || value === 'actual-size' || value === 'custom'
    ? value
    : fallback;

const normalizeScale = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(Math.max(value, 0.1), 8)
    : fallback;

const normalizeInteger = (value: unknown, fallback: number, min: number, max: number): number =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(Math.max(Math.round(value), min), max)
    : fallback;

const normalizeStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? Array.from(new Set(value.filter((item): item is string => typeof item === 'string')))
    : [];
