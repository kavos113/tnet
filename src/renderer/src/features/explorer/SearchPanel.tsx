import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { SearchLineMatch, WorkspaceSearchResponse } from '@shared/search/searchTypes';
import { useAppDispatch, useAppSelector } from '@renderer/app/hooks';
import { requestRevealLine } from '@renderer/features/editor/editorSlice';
import { useActiveWorkspaceApi } from '@renderer/features/workspace/useActiveWorkspaceApi';
import { tnetApi } from '@renderer/lib/tnetApi';

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
      <mark key={`${range.start}-${index}`} className="search-result-highlight">
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
  const workspaceApi = useActiveWorkspaceApi();
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
      tnetApi.search
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
      <div className="search-panel-empty">
        <p>No folder selected</p>
      </div>
    );
  }

  return (
    <section className="search-panel" aria-label="Search">
      <div className="search-input-row">
        <span className="material-icons-round search-input-icon">search</span>
        <input
          ref={inputRef}
          className="search-input"
          value={query}
          placeholder="Search"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {!query.trim() ? <p className="search-panel-hint">Type to search Markdown files.</p> : null}
      {isLoading ? <p className="search-panel-hint">Indexing and searching...</p> : null}
      {errorMessage ? <p className="search-panel-error">{errorMessage}</p> : null}
      {result && !isLoading && result.files.length === 0 ? (
        <p className="search-panel-hint">No results</p>
      ) : null}

      {result && result.files.length > 0 ? (
        <div className="search-results">
          <div className="search-results-summary">
            {result.totalMatches} matches in {result.files.length} files
            {result.truncated ? ' (truncated)' : ''}
          </div>
          {result.files.map((file) => (
            <section key={file.path} className="search-result-file">
              <h3 className="search-result-file-title">{file.relativePath}</h3>
              {file.matches.map((match) => (
                <button
                  key={`${file.path}:${match.lineNumber}:${match.lineText}`}
                  type="button"
                  className="search-result-line"
                  onClick={() => {
                    openMatch(file.path, match.lineNumber).catch((error: unknown) => {
                      console.error('Failed to open search result', error);
                    });
                  }}
                >
                  <span className="search-result-line-number">{match.lineNumber}</span>
                  <span className="search-result-line-text">
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
