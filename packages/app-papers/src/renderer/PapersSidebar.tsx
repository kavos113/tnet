import { usePapersSelector } from './storeHooks';

export const PapersSidebar = (): React.JSX.Element => {
  const { activeLibraryRoot, libraryRoots } = usePapersSelector((state) => state.papersLibrary);

  return (
    <aside className="explorer-panel" aria-label="Papers library">
      <header className="explorer-header">
        <div>
          <div className="explorer-title">Papers</div>
          <div className="explorer-root-label">
            {activeLibraryRoot ? activeLibraryRoot : 'No library selected'}
          </div>
        </div>
      </header>
      <div className="explorer-content">
        {libraryRoots.length > 0 ? (
          <ul className="workspace-list">
            {libraryRoots.map((root) => (
              <li key={root} className={root === activeLibraryRoot ? 'active' : ''}>
                {root}
              </li>
            ))}
          </ul>
        ) : (
          <p className="search-panel-hint">Open a library folder to manage papers.</p>
        )}
      </div>
    </aside>
  );
};
