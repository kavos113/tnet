import type { PdfViewerSidebarPanel } from '@tnet/app-pdf-viewer/shared/pdfViewerTypes';
import styles from './PdfSidebarTabs.module.css';

const panels: Array<{ id: PdfViewerSidebarPanel; label: string; icon: string }> = [
  { id: 'files', label: 'Files', icon: 'folder' },
  { id: 'outline', label: 'Outline', icon: 'toc' },
  { id: 'thumbnails', label: 'Thumbnails', icon: 'view_carousel' },
  { id: 'annotations', label: 'Annotations', icon: 'comment' },
  { id: 'search', label: 'Search', icon: 'search' }
];

export const PdfSidebarTabs = ({
  activePanel,
  onSelectPanel
}: {
  activePanel: PdfViewerSidebarPanel;
  onSelectPanel: (panel: PdfViewerSidebarPanel) => void;
}): React.JSX.Element => (
  <div className={styles.tabs} role="tablist" aria-label="PDF sidebar panels">
    {panels.map((panel) => (
      <button
        key={panel.id}
        type="button"
        className={`${styles.tabButton} ${activePanel === panel.id ? styles.tabButtonActive : ''}`}
        role="tab"
        aria-selected={activePanel === panel.id}
        aria-label={panel.label}
        onClick={() => onSelectPanel(panel.id)}
      >
        <span className="material-icons-round" aria-hidden="true">
          {panel.icon}
        </span>
      </button>
    ))}
  </div>
);
