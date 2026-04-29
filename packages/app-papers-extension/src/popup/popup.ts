import { PapersExtensionServerClient } from '../papersServerClient';
import type { BrowserDetectedPaperSource } from '../types';
import type { PopupState } from './popupStore';
import {
  flattenDirectoryTree,
  importSelectedPaper,
  loadPopupState,
  selectLibrary
} from './popupStore';
import { buildPopupSource } from './popupSource';

const client = new PapersExtensionServerClient();
let state: PopupState;

const rootElement = (): HTMLElement => {
  const root = document.getElementById('root');
  if (!root) throw new Error('Popup root element is missing.');
  return root;
};

const setRoot = (content: Node): void => {
  const root = rootElement();
  root.replaceChildren(content);
};

const createElement = <K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
  textContent?: string
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (textContent !== undefined) element.textContent = textContent;
  return element;
};

const renderMessage = (title: string, message?: string): void => {
  const container = createElement('main', 'paper-popup paper-popup-message');
  container.append(createElement('h1', undefined, title));
  if (message) container.append(createElement('p', undefined, message));
  setRoot(container);
};

const metadataRows = (state: PopupState): Array<[string, string]> => {
  const candidate = state.candidate;
  if (!candidate) return [];
  const rows: Array<[string, string]> = [
    ['Title', candidate.title ?? 'Untitled paper'],
    ['Authors', candidate.authors?.join(', ') ?? ''],
    ['Year', candidate.publishedYear ? String(candidate.publishedYear) : ''],
    ['Venue', candidate.venue ?? ''],
    ['DOI', candidate.doi ?? ''],
    ['arXiv', candidate.arxivId ?? ''],
    ['PDF', candidate.pdfUrl ?? '']
  ];
  return rows.filter(([, value]) => Boolean(value));
};

const renderReady = (): void => {
  const container = createElement('main', 'paper-popup');
  const title = createElement('h1', undefined, 'Import Paper');
  const form = createElement('form', 'paper-popup-form');

  const candidate = state.candidate;
  const hasPdfUrl = Boolean(candidate?.pdfUrl);
  const librarySelect = createElement('select');
  librarySelect.name = 'libraryRoot';
  librarySelect.disabled = state.libraries.length === 0;
  for (const library of state.libraries) {
    const option = createElement('option');
    option.value = library.rootPath;
    option.textContent = library.name ? `${library.name} - ${library.rootPath}` : library.rootPath;
    option.selected = library.rootPath === state.selectedLibraryRoot;
    librarySelect.append(option);
  }
  librarySelect.addEventListener('change', () => {
    renderMessage('Loading directories...');
    selectLibrary(client, state, librarySelect.value)
      .then((nextState) => {
        state = nextState;
        renderReady();
      })
      .catch((error: unknown) => {
        state = {
          ...state,
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Failed to load directories.'
        };
        renderState();
      });
  });

  const directorySelect = createElement('select');
  directorySelect.name = 'directoryPath';
  for (const directory of flattenDirectoryTree(state.directoryTree)) {
    const option = createElement('option');
    option.value = directory.value;
    option.textContent = directory.label;
    option.selected = directory.value === state.selectedDirectoryPath;
    directorySelect.append(option);
  }
  directorySelect.addEventListener('change', () => {
    state = { ...state, selectedDirectoryPath: directorySelect.value };
  });

  const tagsInput = createElement('input');
  tagsInput.type = 'text';
  tagsInput.name = 'tags';
  tagsInput.placeholder = 'tag, another tag';
  tagsInput.value = state.tagsInput;
  tagsInput.addEventListener('input', () => {
    state = { ...state, tagsInput: tagsInput.value };
  });

  const importPdfInput = createElement('input');
  importPdfInput.type = 'checkbox';
  importPdfInput.name = 'importPdf';
  importPdfInput.checked = state.importPdf && hasPdfUrl;
  importPdfInput.disabled = !hasPdfUrl;
  importPdfInput.addEventListener('change', () => {
    state = { ...state, importPdf: importPdfInput.checked };
  });

  const importButton = createElement('button', 'paper-popup-primary', 'Import');
  importButton.type = 'submit';
  importButton.disabled = !state.selectedLibraryRoot || !state.candidate;

  form.append(
    createField('Library', librarySelect),
    createField('Directory', directorySelect),
    createField('Tags', tagsInput),
    createCheckboxField('Download PDF when available', importPdfInput),
    importButton
  );

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    importButton.disabled = true;
    importButton.textContent = 'Importing...';
    importSelectedPaper(client, state)
      .then((nextState) => {
        state = nextState;
        renderState();
      })
      .catch((error: unknown) => {
        state = {
          ...state,
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Failed to import paper.'
        };
        renderState();
      });
  });

  const metadata = createElement('section', 'paper-popup-card');
  metadata.append(createElement('h2', undefined, 'Detected Metadata'));
  const rows = createElement('dl', 'paper-popup-metadata');
  for (const [label, value] of metadataRows(state)) {
    rows.append(createElement('dt', undefined, label), createElement('dd', undefined, value));
  }
  metadata.append(rows);

  if (state.errorMessage) {
    container.append(createElement('p', 'paper-popup-error', state.errorMessage));
  }
  if (state.libraries.length === 0) {
    container.append(
      createElement('p', 'paper-popup-error', 'No paper library is configured in TNet.')
    );
  }

  container.append(title, metadata, form);
  setRoot(container);
};

const createField = (labelText: string, control: HTMLElement): HTMLLabelElement => {
  const label = createElement('label', 'paper-popup-field');
  label.append(createElement('span', undefined, labelText), control);
  return label;
};

const createCheckboxField = (labelText: string, control: HTMLInputElement): HTMLLabelElement => {
  const label = createElement('label', 'paper-popup-checkbox');
  label.append(control, createElement('span', undefined, labelText));
  return label;
};

const renderImported = (): void => {
  const status = state.importResult?.status ?? 'imported';
  const container = createElement('main', 'paper-popup paper-popup-message');
  container.append(
    createElement('h1', undefined, 'Import Complete'),
    createElement('p', undefined, `Status: ${status}`)
  );
  setRoot(container);
};

const renderState = (): void => {
  if (state.status === 'ready') {
    renderReady();
    return;
  }
  if (state.status === 'imported') {
    renderImported();
    return;
  }
  if (state.status === 'server-unavailable') {
    renderMessage('TNet desktop app is not running.', state.errorMessage);
    return;
  }
  renderMessage('Failed to load paper import state.', state.errorMessage);
};

const bootstrap = async (): Promise<void> => {
  const [tab] = (await chrome?.tabs?.query?.({ active: true, currentWindow: true })) ?? [];
  const pageMetadata = await readActiveTabMetadata(tab);
  const source = buildPopupSource(tab, pageMetadata);

  renderMessage('Loading paper metadata...');
  state = await loadPopupState(client, source);
  renderState();
};

const readActiveTabMetadata = async (
  tab: ChromeTab | undefined
): Promise<BrowserDetectedPaperSource | undefined> => {
  if (typeof tab?.id !== 'number') return undefined;

  try {
    const response = await chrome?.tabs?.sendMessage?.(tab.id, {
      type: 'tnet:paper:read-metadata'
    });
    return isBrowserDetectedPaperSource(response) ? response : undefined;
  } catch {
    return undefined;
  }
};

const isBrowserDetectedPaperSource = (value: unknown): value is BrowserDetectedPaperSource =>
  typeof value === 'object' &&
  value !== null &&
  'sourceUrl' in value &&
  typeof value.sourceUrl === 'string';

void bootstrap();
