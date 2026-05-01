import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type {
  SearchLineMatch,
  WorkspaceSearchResponse
} from '@tnet/app-markdown/shared/search/searchTypes';
import { useAppDispatch, useAppSelector } from '@tnet/app-markdown/renderer/storeHooks';
import { requestRevealLine } from '@tnet/app-markdown/renderer/editor/editorSlice';
import { markdownTnetApi } from '@tnet/app-markdown/renderer/markdownTnetApi';
import { useActiveMarkdownWorkspaceApi } from '@tnet/app-markdown/renderer/workspace/useActiveMarkdownWorkspaceApi';
import styles from './SearchPanel.module.css';

export interface SearchPanelHandle {
  focusInput: () => void;
}

const searchDebounceMs = 250;

const HighlightedLine = ({ match }: { match: SearchLineMatch }): React.JSX.Element => {
  const parts: React.ReactNode[] = [];
  let position = 0;

  match.ranges.forEach((range, index) => {
    if (range.start > position) {
      parts.push(match.lineText.slice(position, range.start));
    }
    parts.push(
      <mark key={`${range.start}-${index}`} className={styles.highlight}>
        {match.lineText.slice(range.start, range.end)}
      </mark>
    );
    position = range.end;
  });

  if (position < match.lineText.length) {
    parts.push(match.lineText.slice(position));
  }

  return <>{parts}</>;
};

export const SearchPanel = forwardRef<SearchPanelHandle>((_, ref): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const workspaceApi = useActiveMarkdownWorkspaceApi();
  const rootPath = useAppSelector((state) => state.workspace.rootPath);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<WorkspaceSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      focusInput: () => inputRef.current?.focus()
    }),
    []
  );

  useEffect(() => {
    if (!rootPath || !query.trim()) {
      setResult(null);
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }

    let canceled = false;
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);
      setErrorMessage(null);
      markdownTnetApi.markdown.search
        .workspace({ rootDir: rootPath, query })
        .then((nextResult) => {
          if (!canceled) setResult(nextResult);
        })
        .catch((error: unknown) => {
          console.error('Failed to search workspace', error);
          if (!canceled) setErrorMessage('Search failed.');
        })
        .finally(() => {
          if (!canceled) setIsLoading(false);
        });
    }, searchDebounceMs);

    return () => {
      canceled = true;
      window.clearTimeout(timeoutId);
    };
  }, [query, rootPath]);

  const openMatch = async (filePath: string, lineNumber: number): Promise<void> => {
    await workspaceApi.openFile(filePath);
    dispatch(requestRevealLine({ path: filePath, lineNumber }));
  };

  if (!rootPath) {
    return (
      <div className={styles.empty}>
        <p>No folder selected</p>
      </div>
    );
  }

  return (
    <section className={styles.panel} aria-label="Search">
      <div className={styles.inputRow}>
        <span className={`material-icons-round ${styles.inputIcon}`}>search</span>
        <input
          ref={inputRef}
          className={styles.input}
          value={query}
          placeholder="Search"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {!query.trim() ? <p className={styles.hint}>Type to search Markdown files.</p> : null}
      {isLoading ? <p className={styles.hint}>Indexing and searching...</p> : null}
      {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
      {result && !isLoading && result.files.length === 0 ? (
        <p className={styles.hint}>No results</p>
      ) : null}

      {result && result.files.length > 0 ? (
        <div className={styles.results}>
          <div className={styles.summary}>
            {result.totalMatches} matches in {result.files.length} files
            {result.truncated ? ' (truncated)' : ''}
          </div>
          {result.files.map((file) => (
            <section key={file.path} className={styles.resultFile}>
              <h3 className={styles.resultFileTitle}>{file.relativePath}</h3>
              {file.matches.map((match) => (
                <button
                  key={`${file.path}:${match.lineNumber}:${match.lineText}`}
                  type="button"
                  className={styles.resultLine}
                  onClick={() => {
                    openMatch(file.path, match.lineNumber).catch((error: unknown) => {
                      console.error('Failed to open search result', error);
                    });
                  }}
                >
                  <span className={styles.resultLineNumber}>{match.lineNumber}</span>
                  <span className={styles.resultLineText}>
                    <HighlightedLine match={match} />
                  </span>
                </button>
              ))}
            </section>
          ))}
        </div>
      ) : null}
    </section>
  );
});

SearchPanel.displayName = 'SearchPanel';
