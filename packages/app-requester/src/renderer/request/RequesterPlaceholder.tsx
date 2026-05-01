import styles from '../RequesterShared.module.css';

interface RequesterPlaceholderProps {
  icon: string;
  title: string;
  message: string;
}

export const RequesterPlaceholder = ({
  icon,
  title,
  message
}: RequesterPlaceholderProps): React.JSX.Element => (
  <main className={styles.placeholder} aria-label="Requester">
    <section className={styles.placeholderContent}>
      <span className={`material-icons-round ${styles.placeholderIcon}`} aria-hidden="true">
        {icon}
      </span>
      <h1>{title}</h1>
      <p>{message}</p>
    </section>
  </main>
);
