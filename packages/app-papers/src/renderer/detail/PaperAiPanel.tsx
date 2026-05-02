import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  PaperAiInputMode,
  PaperAiOperation,
  PaperAiOutput
} from '@tnet/app-papers/shared/paperTypes';
import { papersTnetApi } from '../papersTnetApi';
import styles from './PaperAiPanel.module.css';

export const PaperAiPanel = ({
  libraryRoot,
  paperId,
  pdfPath,
  operation,
  outputs,
  defaultTargetLanguage,
  onGenerated,
  onAppendToNote
}: {
  libraryRoot: string;
  paperId: string;
  pdfPath?: string;
  operation: PaperAiOperation;
  outputs: PaperAiOutput[];
  defaultTargetLanguage: string;
  onGenerated: (output: PaperAiOutput) => void;
  onAppendToNote: (content: string) => void;
}): React.JSX.Element => {
  const [inputMode, setInputMode] = useState<PaperAiInputMode>('pdf-direct');
  const [targetLanguage, setTargetLanguage] = useState(defaultTargetLanguage || 'Japanese');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [error, setError] = useState('');
  const streamRequestIdRef = useRef('');
  const selectedOutput = useMemo(
    () =>
      outputs.find(
        (output) =>
          output.operation === operation &&
          output.inputMode === inputMode &&
          output.targetLanguage === targetLanguage
      ),
    [inputMode, operation, outputs, targetLanguage]
  );
  const title = operation === 'translate' ? 'Translate' : 'Summary';
  const canGenerate = Boolean(libraryRoot && paperId && pdfPath && targetLanguage.trim());
  const visibleContent = isGenerating
    ? streamedContent || 'Waiting for the first chunk...'
    : (selectedOutput?.content ?? 'Generate a result to display it here.');

  useEffect(
    () =>
      papersTnetApi.papers.ai.onStreamEvent((streamEvent) => {
        if (streamEvent.requestId !== streamRequestIdRef.current) return;
        if (streamEvent.type === 'delta') {
          setStreamedContent((current) => `${current}${streamEvent.delta ?? ''}`);
        }
        if (streamEvent.type === 'error') {
          setError(streamEvent.message ?? `Failed to generate ${title.toLowerCase()}.`);
        }
      }),
    [title]
  );

  const generate = async (): Promise<void> => {
    if (!canGenerate) return;
    setIsGenerating(true);
    setStreamedContent('');
    setError('');
    const streamRequestId = createStreamRequestId();
    streamRequestIdRef.current = streamRequestId;
    try {
      const request = {
        libraryRoot,
        paperId,
        pdfPath,
        targetLanguage,
        operation,
        inputMode,
        streamRequestId
      };
      const output =
        operation === 'translate'
          ? inputMode === 'pdf-direct'
            ? await papersTnetApi.papers.ai.translatePdf(request)
            : await papersTnetApi.papers.ai.translateText(request)
          : inputMode === 'pdf-direct'
            ? await papersTnetApi.papers.ai.summarizePdf(request)
            : await papersTnetApi.papers.ai.summarizeText(request);
      onGenerated(output);
      setStreamedContent(output.content);
    } catch (generateError) {
      console.error(`Failed to generate paper ${operation}`, generateError);
      setError(`Failed to generate ${title.toLowerCase()}.`);
    } finally {
      setIsGenerating(false);
      streamRequestIdRef.current = '';
    }
  };

  return (
    <section className={styles.panel} aria-label={`Paper ${title}`}>
      <div className={styles.toolbar}>
        <div className={styles.segmented} aria-label={`${title} input mode`}>
          {(['pdf-direct', 'text'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={inputMode === mode ? styles.active : ''}
              aria-pressed={inputMode === mode}
              onClick={() => setInputMode(mode)}
            >
              {mode === 'pdf-direct' ? 'PDF direct' : 'Text'}
            </button>
          ))}
        </div>
        <input
          className={styles.languageInput}
          aria-label={`${title} target language`}
          value={targetLanguage}
          onChange={(event) => setTargetLanguage(event.currentTarget.value)}
        />
        <button
          type="button"
          className={styles.actionButton}
          disabled={!canGenerate || isGenerating}
          onClick={() => void generate()}
        >
          {selectedOutput ? 'Regenerate' : 'Generate'}
        </button>
        <button
          type="button"
          className={styles.actionButton}
          disabled={!selectedOutput}
          onClick={() => selectedOutput && navigator.clipboard.writeText(selectedOutput.content)}
        >
          Copy
        </button>
        <button
          type="button"
          className={styles.actionButton}
          disabled={!selectedOutput}
          onClick={() => selectedOutput && onAppendToNote(selectedOutput.content)}
        >
          Append to Note
        </button>
      </div>
      <div className={styles.meta} aria-live="polite">
        {isGenerating
          ? streamedContent
            ? 'Generating...'
            : 'Starting generation...'
          : selectedOutput
            ? `${selectedOutput.provider} / ${selectedOutput.model} / ${selectedOutput.updatedAt}`
            : pdfPath
              ? 'No saved result.'
              : 'No PDF registered.'}
      </div>
      {error ? <div className={styles.error}>{error}</div> : null}
      <div className={styles.content}>{visibleContent}</div>
    </section>
  );
};

const createStreamRequestId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
