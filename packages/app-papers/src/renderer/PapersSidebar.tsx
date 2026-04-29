import { basename } from '@tnet/shared/path/pathUtils';
import { usePapersSelector } from './storeHooks';
import { usePapersLibrarySwitcher } from './library/usePapersLibrarySwitcher';

const libraryLabel = (rootPath: string): string => basename(rootPath) || rootPath;

const libraryInitial = (rootPath: string): string => {
  const label = libraryLabel(rootPath).trim();
  return (label[0] ?? '?').toUpperCase();
};

export const PapersSidebar = (): React.JSX.Element => {
  const { activeLibraryRoot, libraryRoots } = usePapersSelector((state) => state.papersLibrary);
  const { openLibrary, switchLibrary } = usePapersLibrarySwitcher();

  return (
    <aside className="explorer-panel" aria-label="Papers library">
      <nav className="workspace-switcher" aria-label="Paper libraries">
        {libraryRoots.map((libraryRoot) => (
          <button
            key={libraryRoot}
            type="button"
            className={`workspace-switcher-item ${
              libraryRoot === activeLibraryRoot ? 'workspace-switcher-item-active' : ''
            }`}
            title={libraryRoot}
            aria-label={`Switch to ${libraryLabel(libraryRoot)}`}
            aria-current={libraryRoot === activeLibraryRoot ? 'page' : undefined}
            onClick={() => {
              if (libraryRoot === activeLibraryRoot) return;
              switchLibrary(libraryRoot).catch((error: unknown) => {
                console.error('Failed to switch paper library', error);
              });
            }}
          >
            {libraryInitial(libraryRoot)}
          </button>
        ))}
        <button
          type="button"
          className="workspace-switcher-add material-icons-round"
          aria-label="Open paper library"
          title="Open paper library"
          onClick={() => {
            openLibrary().catch((error: unknown) => {
              console.error('Failed to open paper library', error);
            });
          }}
        >
          add
        </button>
      </nav>
      <div className="explorer-content">
        <header className="sidebar-header">
          <span className="sidebar-title">Papers</span>
        </header>
        <section className="papers-library-summary">
          <span className="papers-library-label">Library</span>
          <strong>
            {activeLibraryRoot ? libraryLabel(activeLibraryRoot) : 'No library selected'}
          </strong>
          {activeLibraryRoot ? <small title={activeLibraryRoot}>{activeLibraryRoot}</small> : null}
          <button type="button" className="open-folder-button" onClick={openLibrary}>
            Open Library
          </button>
        </section>
      </div>
    </aside>
  );
};
