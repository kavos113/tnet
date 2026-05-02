import styles from './TabBar.module.css';

export interface TabBarItem {
  id: string;
  label: string;
  isModified?: boolean;
}

export interface TabBarProps {
  tabs: TabBarItem[];
  activeId: string | null;
  ariaLabel: string;
  onSelectTab: (id: string, index: number) => void;
  onCloseTab: (id: string, index: number) => void;
  onMouseDown?: () => void;
}

export const TabBar = ({
  tabs,
  activeId,
  ariaLabel,
  onSelectTab,
  onCloseTab,
  onMouseDown
}: TabBarProps): React.JSX.Element | null => {
  if (tabs.length === 0) return null;

  return (
    <div className={styles.tabBar} role="tablist" aria-label={ariaLabel} onMouseDown={onMouseDown}>
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          type="button"
          className={`${styles.tab} ${tab.id === activeId ? styles.active : ''}`}
          role="tab"
          aria-selected={tab.id === activeId}
          onClick={() => onSelectTab(tab.id, index)}
        >
          <span className={styles.tabName}>{tab.label}</span>
          {tab.isModified ? <span className={styles.modifiedIndicator}>*</span> : null}
          <span
            className={styles.tabClose}
            role="button"
            tabIndex={0}
            aria-label={`Close ${tab.label}`}
            onClick={(event) => {
              event.stopPropagation();
              onCloseTab(tab.id, index);
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              event.stopPropagation();
              onCloseTab(tab.id, index);
            }}
          >
            x
          </span>
        </button>
      ))}
    </div>
  );
};
