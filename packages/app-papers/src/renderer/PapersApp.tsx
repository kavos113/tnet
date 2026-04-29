import { usePapersSelector } from './storeHooks';

export const PapersApp = (): React.JSX.Element => {
  const { activeLibraryRoot, isRestored } = usePapersSelector((state) => state.papersLibrary);

  if (!isRestored) {
    return (
      <main className="placeholder-app" aria-label="Papers">
        <section className="placeholder-app-content">
          <span className="material-icons-round placeholder-app-icon" aria-hidden="true">
            article
          </span>
          <h1>Papers</h1>
          <p>Restoring paper library...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="placeholder-app" aria-label="Papers">
      <section className="placeholder-app-content">
        <span className="material-icons-round placeholder-app-icon" aria-hidden="true">
          article
        </span>
        <h1>Papers</h1>
        <p>
          {activeLibraryRoot
            ? `Paper library: ${activeLibraryRoot}`
            : 'Open a paper library to begin.'}
        </p>
      </section>
    </main>
  );
};
