import styles from '../TasksAgenda.module.css';

export const SectionHeader = ({
  count,
  title
}: {
  count: number;
  title: string;
}): React.JSX.Element => (
  <header className={styles.sectionHeader}>
    <h2 className={styles.sectionTitle}>{title}</h2>
    <span className={styles.count}>{count}</span>
  </header>
);
