import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PaperAiStreamEvent } from '@tnet/app-papers/shared/ipc';
import type { PaperAiOutput } from '@tnet/app-papers/shared/paperTypes';
import { PaperAiPanel } from './PaperAiPanel';

const translatePdf = vi.fn();
let streamListener: ((event: PaperAiStreamEvent) => void) | undefined;

const output: PaperAiOutput = {
  paperId: 'paper-1',
  operation: 'translate',
  inputMode: 'pdf-direct',
  targetLanguage: 'Japanese',
  provider: 'mock',
  model: 'mock-paper-ai',
  content: 'streamed final',
  updatedAt: '2026-05-02T00:00:00Z'
};

describe('PaperAiPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    streamListener = undefined;
    translatePdf.mockImplementation(async (request: { streamRequestId?: string }) => {
      streamListener?.({
        requestId: request.streamRequestId ?? '',
        type: 'delta',
        delta: 'streamed '
      });
      streamListener?.({
        requestId: request.streamRequestId ?? '',
        type: 'delta',
        delta: 'content'
      });
      return output;
    });
    Object.defineProperty(window, 'tnet', {
      value: {
        papers: {
          ai: {
            translatePdf,
            translateText: vi.fn(),
            summarizePdf: vi.fn(),
            summarizeText: vi.fn(),
            onStreamEvent: (listener: (event: PaperAiStreamEvent) => void) => {
              streamListener = listener;
              return () => {
                streamListener = undefined;
              };
            }
          }
        }
      },
      writable: true
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders streamed deltas while generating and stores the final output', async () => {
    const onGenerated = vi.fn();
    render(
      <PaperAiPanel
        libraryRoot="/papers/library"
        paperId="paper-1"
        pdfPath="papers/lambda.pdf"
        operation="translate"
        outputs={[]}
        defaultTargetLanguage="Japanese"
        onGenerated={onGenerated}
        onAppendToNote={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));

    expect(await screen.findByText('streamed content')).toBeInTheDocument();
    await waitFor(() => {
      expect(onGenerated).toHaveBeenCalledWith(output);
    });
    expect(translatePdf).toHaveBeenCalledWith(
      expect.objectContaining({
        libraryRoot: '/papers/library',
        paperId: 'paper-1',
        pdfPath: 'papers/lambda.pdf',
        streamRequestId: expect.any(String)
      })
    );
  });
});
