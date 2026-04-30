import type { BibtexPaperMetadata } from '@tnet/app-papers/shared/bibtex';
import { PAPER_METADATA_FIELD_LABELS } from '@tnet/app-papers/shared/paperMetadataFields';
import { PapersExtensionServerClient } from '../papersServerClient';
import type { PopupState } from './popupStore';
import {
  flattenDirectoryTree,
  importSelectedPaper,
  loadPopupState,
  selectLibrary,
  updateBibtexInput,
  updateMetadata
} from './popupStore';

const client = new PapersExtensionServerClient();
let state: PopupState;
let selectedPdfFile: File | null = null;

const rootElement = (): HTMLElement => {
  const root = document.getElementById('root');
  if (!root) throw new Error('Popup root element is missing.');
  return root;
};

const setRoot = (content: Node): void => {
  rootElement().replaceChildren(content);
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

const renderReady = (): void => {
  const container = createElement('main', 'paper-popup');
  const title = createElement('h1', undefined, 'Import Paper');
  const form = createElement('form', 'paper-popup-form');

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

  const bibtexInput = createElement('textarea');
  bibtexInput.name = 'bibtex';
  bibtexInput.rows = 8;
  bibtexInput.placeholder = '@article{...}';
  bibtexInput.value = state.bibtexInput;
  bibtexInput.addEventListener('input', () => {
    state = updateBibtexInput(state, bibtexInput.value);
  });

  const pasteButton = createElement('button', 'paper-popup-secondary', 'Paste from clipboard');
  pasteButton.type = 'button';
  pasteButton.addEventListener('click', () => {
    navigator.clipboard
      .readText()
      .then((text) => {
        state = updateBibtexInput(state, text);
        renderReady();
      })
      .catch(() => {
        state = {
          ...state,
          errorMessage: 'Clipboard read failed. Paste BibTeX manually.'
        };
        renderReady();
      });
  });

  const fileInput = createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'application/pdf,.pdf';
  fileInput.addEventListener('change', () => {
    selectedPdfFile = fileInput.files?.[0] ?? null;
    state = {
      ...state,
      selectedPdfFileName: selectedPdfFile?.name,
      selectedPdfFileSize: selectedPdfFile?.size,
      errorMessage: undefined
    };
    renderReady();
  });

  const metadata = createMetadataFields(state.metadata, (nextMetadata) => {
    state = updateMetadata(state, nextMetadata);
  });

  const importButton = createElement('button', 'paper-popup-primary', 'Import');
  importButton.type = 'submit';
  importButton.disabled = !state.selectedLibraryRoot || !selectedPdfFile;
  const statusMessage = createElement('p', 'paper-popup-progress');
  statusMessage.hidden = !state.importStatusMessage;
  statusMessage.textContent = state.importStatusMessage ?? '';

  form.append(
    createField('Library', librarySelect),
    createField('Directory', directorySelect),
    createField('BibTeX', bibtexInput),
    pasteButton,
    createBibtexDiagnostics(),
    metadata,
    createField('Downloaded PDF', fileInput),
    selectedPdfFile
      ? createElement(
          'p',
          'paper-popup-progress',
          `Selected: ${selectedPdfFile.name} (${formatBytes(selectedPdfFile.size)})`
        )
      : createElement(
          'p',
          'paper-popup-progress',
          'Select a PDF from Downloads or another folder.'
        ),
    statusMessage,
    importButton
  );

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    importButton.disabled = true;
    importButton.textContent = 'Importing...';
    state = { ...state, importStatusMessage: 'Reading PDF...' };
    statusMessage.hidden = false;
    statusMessage.textContent = state.importStatusMessage ?? '';
    readSelectedPdf()
      .then((pdfFile) => {
        state = { ...state, importStatusMessage: 'Saving paper...' };
        statusMessage.textContent = state.importStatusMessage ?? '';
        return importSelectedPaper(client, state, pdfFile);
      })
      .then((nextState) => {
        state = nextState;
        selectedPdfFile = null;
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

  if (state.errorMessage) {
    container.append(createElement('p', 'paper-popup-error', state.errorMessage));
  }
  if (state.libraries.length === 0) {
    container.append(
      createElement('p', 'paper-popup-error', 'No paper library is configured in TNet.')
    );
  }

  container.append(title, form);
  setRoot(container);
};

const createBibtexDiagnostics = (): HTMLElement => {
  const container = createElement('div');
  container.hidden = state.bibtexDiagnostics.length === 0;
  for (const diagnostic of state.bibtexDiagnostics) {
    container.append(
      createElement(
        'p',
        diagnostic.severity === 'error' ? 'paper-popup-error' : 'paper-popup-warning',
        diagnostic.message
      )
    );
  }
  return container;
};

const createMetadataFields = (
  metadata: BibtexPaperMetadata,
  onChange: (metadata: BibtexPaperMetadata) => void
): HTMLElement => {
  const container = createElement('section', 'paper-popup-card');
  container.append(createElement('h2', undefined, 'Metadata'));
  const title = createTextInput(metadata.title ?? '', (value) =>
    onChange({ ...metadata, title: value })
  );
  const authors = createTextInput(metadata.authors?.join(', ') ?? '', (value) =>
    onChange({
      ...metadata,
      authors: value
        .split(',')
        .map((author) => author.trim())
        .filter(Boolean)
    })
  );
  const year = createTextInput(
    metadata.publishedYear ? String(metadata.publishedYear) : '',
    (value) => onChange({ ...metadata, publishedYear: value ? Number(value) : undefined })
  );
  const venue = createTextInput(metadata.venue ?? '', (value) =>
    onChange({ ...metadata, venue: value })
  );
  const doi = createTextInput(metadata.doi ?? '', (value) => onChange({ ...metadata, doi: value }));
  const arxivId = createTextInput(metadata.arxivId ?? '', (value) =>
    onChange({ ...metadata, arxivId: value })
  );
  const url = createTextInput(metadata.url ?? '', (value) => onChange({ ...metadata, url: value }));
  const abstract = createElement('textarea');
  abstract.rows = 4;
  abstract.value = metadata.abstract ?? '';
  abstract.addEventListener('input', () => onChange({ ...metadata, abstract: abstract.value }));
  container.append(
    createField(PAPER_METADATA_FIELD_LABELS.title, title),
    createField(PAPER_METADATA_FIELD_LABELS.authors, authors),
    createField(PAPER_METADATA_FIELD_LABELS.publishedYear, year),
    createField(PAPER_METADATA_FIELD_LABELS.venue, venue),
    createField(PAPER_METADATA_FIELD_LABELS.doi, doi),
    createField(PAPER_METADATA_FIELD_LABELS.arxivId, arxivId),
    createField(PAPER_METADATA_FIELD_LABELS.url, url),
    createField(PAPER_METADATA_FIELD_LABELS.abstract, abstract)
  );
  return container;
};

const createTextInput = (value: string, onInput: (value: string) => void): HTMLInputElement => {
  const input = createElement('input');
  input.value = value;
  input.addEventListener('input', () => onInput(input.value));
  return input;
};

const readSelectedPdf = async (): Promise<{
  name: string;
  bytes: Uint8Array<ArrayBuffer>;
} | null> => {
  if (!selectedPdfFile) return null;
  return {
    name: selectedPdfFile.name,
    bytes: new Uint8Array(await selectedPdfFile.arrayBuffer())
  };
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const createField = (labelText: string, control: HTMLElement): HTMLLabelElement => {
  const label = createElement('label', 'paper-popup-field');
  label.append(createElement('span', undefined, labelText), control);
  return label;
};

const renderImported = (): void => {
  const container = createElement('main', 'paper-popup paper-popup-message');
  const importedPaper = readImportedPaper(state.importResult);
  container.append(
    createElement(
      'h1',
      undefined,
      importedPaper.alreadyExists ? 'Already Imported' : 'Import Complete'
    ),
    createElement('p', undefined, importedPaper.title || 'The selected PDF was imported.')
  );
  if (importedPaper.alreadyExists) {
    container.append(
      createElement(
        'p',
        'paper-popup-warning',
        `Matched existing paper${importedPaper.duplicateField ? ` by ${importedPaper.duplicateField}` : ''}.`
      )
    );
  }
  if (importedPaper.destination) {
    container.append(createElement('p', 'paper-popup-progress', importedPaper.destination));
  }
  setRoot(container);
};

const readImportedPaper = (
  result: unknown
): { title?: string; destination?: string; alreadyExists?: boolean; duplicateField?: string } => {
  if (!result || typeof result !== 'object') return {};
  const importResult = result as {
    paper?: unknown;
    alreadyExists?: unknown;
    duplicateField?: unknown;
  };
  const paperSource =
    importResult.paper && typeof importResult.paper === 'object' ? importResult.paper : result;
  const paper = paperSource as { title?: unknown; directoryPath?: unknown; pdfPath?: unknown };
  return {
    title: typeof paper.title === 'string' ? paper.title : undefined,
    destination:
      typeof paper.pdfPath === 'string'
        ? paper.pdfPath
        : typeof paper.directoryPath === 'string'
          ? paper.directoryPath
          : undefined,
    alreadyExists: importResult.alreadyExists === true,
    duplicateField:
      typeof importResult.duplicateField === 'string' ? importResult.duplicateField : undefined
  };
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
  renderMessage('Loading paper libraries...');
  state = await loadPopupState(client);
  renderState();
};

void bootstrap();
