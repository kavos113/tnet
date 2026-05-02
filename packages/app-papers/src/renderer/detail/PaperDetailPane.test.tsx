import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultPapersLibraryConfig } from '@tnet/app-papers/shared/config';
import type { PaperDetail } from '@tnet/app-papers/shared/paperTypes';
import { PaperDetailPane } from './PaperDetailPane';

vi.mock('../papers/PdfViewer', () => ({
  PdfViewer: () => <div data-testid="pdf-viewer" />
}));

vi.mock('@tnet/markdown-editor/renderer', () => ({
  MarkdownEditorSurface: ({
    content,
    onChange
  }: {
    content: string;
    onChange: (content: string) => void;
  }) => (
    <textarea
      aria-label="Paper note"
      value={content}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  )
}));

const detail: PaperDetail = {
  id: 'paper-1',
  title: 'Lambda Calculus Foundations',
  authors: ['Alonzo Church'],
  publishedYear: 1936,
  venue: 'Annals of Mathematics',
  tags: ['logic'],
  hasPdf: true,
  abstract: 'A concise account of lambda calculus foundations.',
  pdfPath: 'papers/lambda.pdf',
  directoryPath: 'logic',
  noteContent: '# Note'
};

const noteSettings = defaultPapersLibraryConfig();

describe('PaperDetailPane', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders no-selection and loading states', () => {
    const { rerender } = render(
      <PaperDetailPane
        activeLibraryRoot="/papers/library"
        selectedPaperId=""
        detail={null}
        tags={[]}
        activeDetailTab="pdf"
        isLoading={false}
        widthPercent={60}
        noteSettings={{ ...noteSettings, noteEditorMode: 'editor' }}
        onNoteSettingsChange={vi.fn()}
        onSelectTab={vi.fn()}
        onCreateTag={vi.fn()}
        onAttachTag={vi.fn()}
        onDetachTag={vi.fn()}
        onSaveNote={vi.fn()}
      />
    );

    expect(screen.getByText('Select a paper.')).toBeInTheDocument();

    rerender(
      <PaperDetailPane
        activeLibraryRoot="/papers/library"
        selectedPaperId="paper-1"
        detail={null}
        tags={[]}
        activeDetailTab="pdf"
        isLoading
        widthPercent={60}
        noteSettings={{ ...noteSettings, noteEditorMode: 'editor' }}
        onNoteSettingsChange={vi.fn()}
        onSelectTab={vi.fn()}
        onCreateTag={vi.fn()}
        onAttachTag={vi.fn()}
        onDetachTag={vi.fn()}
        onSaveNote={vi.fn()}
      />
    );

    expect(screen.getByText('Loading paper detail...')).toBeInTheDocument();
  });

  it('renders detail tabs and delegates tab selection', () => {
    const onSelectTab = vi.fn();
    const onCreateTag = vi.fn();
    const onDetachTag = vi.fn();
    const { rerender } = render(
      <PaperDetailPane
        activeLibraryRoot="/papers/library"
        selectedPaperId="paper-1"
        detail={detail}
        tags={[{ id: 'tag-1', name: 'logic' }]}
        activeDetailTab="metadata"
        isLoading={false}
        widthPercent={60}
        noteSettings={{ ...noteSettings, noteEditorMode: 'editor' }}
        onNoteSettingsChange={vi.fn()}
        onSelectTab={onSelectTab}
        onCreateTag={onCreateTag}
        onAttachTag={vi.fn()}
        onDetachTag={onDetachTag}
        onSaveNote={vi.fn()}
      />
    );

    expect(screen.getByText('Lambda Calculus Foundations')).toBeInTheDocument();
    expect(screen.getByText('Annals of Mathematics')).toBeInTheDocument();
    expect(
      screen.getByText('A concise account of lambda calculus foundations.')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'logic' }));
    expect(onDetachTag).toHaveBeenCalledWith('tag-1');
    fireEvent.change(screen.getByRole('textbox', { name: 'New paper tag' }), {
      target: { value: 'semantics' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add paper tag' }));
    expect(onCreateTag).toHaveBeenCalledWith('semantics');

    fireEvent.click(screen.getByRole('button', { name: 'PDF' }));
    expect(onSelectTab).toHaveBeenCalledWith('pdf');

    rerender(
      <PaperDetailPane
        activeLibraryRoot="/papers/library"
        selectedPaperId="paper-1"
        detail={detail}
        tags={[]}
        activeDetailTab="pdf"
        isLoading={false}
        widthPercent={60}
        noteSettings={{ ...noteSettings, noteEditorMode: 'editor' }}
        onNoteSettingsChange={vi.fn()}
        onSelectTab={onSelectTab}
        onCreateTag={vi.fn()}
        onAttachTag={vi.fn()}
        onDetachTag={vi.fn()}
        onSaveNote={vi.fn()}
      />
    );

    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
  });

  it('renders an editable note tab, changes note mode, and debounces save', () => {
    vi.useFakeTimers();
    const onSaveNote = vi.fn().mockResolvedValue(undefined);
    const onNoteSettingsChange = vi.fn();

    render(
      <PaperDetailPane
        activeLibraryRoot="/papers/library"
        selectedPaperId="paper-1"
        detail={detail}
        tags={[]}
        activeDetailTab="note"
        isLoading={false}
        widthPercent={60}
        noteSettings={{ ...noteSettings, noteEditorMode: 'editor', noteAutoSaveDebounceMs: 1000 }}
        onNoteSettingsChange={onNoteSettingsChange}
        onSelectTab={vi.fn()}
        onCreateTag={vi.fn()}
        onAttachTag={vi.fn()}
        onDetachTag={vi.fn()}
        onSaveNote={onSaveNote}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(onNoteSettingsChange).toHaveBeenCalledWith({
      ...noteSettings,
      noteEditorMode: 'preview',
      noteAutoSaveDebounceMs: 1000
    });

    fireEvent.change(screen.getByRole('textbox', { name: 'Paper note' }), {
      target: { value: '# Updated note' }
    });

    expect(onSaveNote).not.toHaveBeenCalled();
    vi.advanceTimersByTime(999);
    expect(onSaveNote).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onSaveNote).toHaveBeenCalledWith('# Updated note');
    vi.useRealTimers();
  });

  it('toggles note view between split PDF and full panel', () => {
    render(
      <PaperDetailPane
        activeLibraryRoot="/papers/library"
        selectedPaperId="paper-1"
        detail={detail}
        tags={[]}
        activeDetailTab="note"
        isLoading={false}
        widthPercent={60}
        noteSettings={{ ...noteSettings, noteEditorMode: 'editor' }}
        onNoteSettingsChange={vi.fn()}
        onSelectTab={vi.fn()}
        onCreateTag={vi.fn()}
        onAttachTag={vi.fn()}
        onDetachTag={vi.fn()}
        onSaveNote={vi.fn()}
      />
    );

    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Full panel' }));
    expect(screen.queryByTestId('pdf-viewer')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Split PDF' }));
    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
  });
});
