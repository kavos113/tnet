export const RequesterSidebar = (): React.JSX.Element => (
  <aside className="explorer-panel" aria-label="Requester workspace">
    <div className="explorer-content">
      <header className="sidebar-header">
        <span className="sidebar-title">Requester</span>
      </header>
      <section className="requester-sidebar-section" aria-label="API requests">
        <button type="button" className="open-folder-button">
          New Workspace
        </button>
        <p className="empty-list-message">No request workspace selected</p>
      </section>
    </div>
  </aside>
);
