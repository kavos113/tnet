import { basename, normalizeToSlash } from '@tnet/shared/path/pathUtils';

export interface PdfLinkTarget {
  workspaceName: string;
  relativePath: string;
}

export type PdfLinkParseResult = { ok: true; target: PdfLinkTarget } | { ok: false; error: string };

const pdfScheme = 'pdf:';

export const isPdfLinkHref = (href: string): boolean =>
  href.trim().toLowerCase().startsWith(pdfScheme);

export const workspaceNameForRoot = (rootPath: string): string => basename(rootPath);

export const parsePdfLinkTarget = (href: string): PdfLinkParseResult => {
  const trimmed = href.trim();
  if (!isPdfLinkHref(trimmed)) return { ok: false, error: 'PDF link must start with pdf:.' };

  const rawTarget = trimmed.slice(pdfScheme.length).replace(/^\/+/, '');
  const separatorIndex = rawTarget.indexOf('/');
  if (separatorIndex <= 0 || separatorIndex === rawTarget.length - 1) {
    return {
      ok: false,
      error: 'PDF link must use pdf:<workspace-name>/<relative-path.pdf>.'
    };
  }

  const workspaceName = decodePdfLinkPart(rawTarget.slice(0, separatorIndex));
  const relativePath = normalizePdfRelativePath(
    rawTarget
      .slice(separatorIndex + 1)
      .split('/')
      .map(decodePdfLinkPart)
      .join('/')
  );
  if (!workspaceName) return { ok: false, error: 'PDF workspace name is empty.' };
  if (!relativePath) return { ok: false, error: 'PDF path is empty.' };
  if (relativePath.startsWith('../') || relativePath.includes('/../') || relativePath === '..') {
    return { ok: false, error: 'PDF path cannot contain parent directory segments.' };
  }
  if (!relativePath.toLowerCase().endsWith('.pdf')) {
    return { ok: false, error: 'PDF link target must be a .pdf file.' };
  }

  return {
    ok: true,
    target: {
      workspaceName,
      relativePath
    }
  };
};

export const createPdfLinkHref = (workspaceName: string, relativePath: string): string =>
  `pdf:${encodePdfLinkPart(workspaceName)}/${encodePdfRelativePath(relativePath)}`;

export const normalizePdfRelativePath = (relativePath: string): string =>
  normalizeToSlash(relativePath)
    .replace(/^\/+/, '')
    .replace(/\/{2,}/g, '/');

export const encodePdfRelativePath = (relativePath: string): string =>
  normalizePdfRelativePath(relativePath).split('/').map(encodePdfLinkPart).join('/');

export const encodePdfLinkPart = (value: string): string => encodeURIComponent(value);

const decodePdfLinkPart = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};
