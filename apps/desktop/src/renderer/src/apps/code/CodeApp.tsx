import styles from './CodeApp.module.css';

export const CodeApp = (): React.JSX.Element => (
  <main className={styles.placeholder} aria-label="Code">
    <section className={styles.content}>
      <span className={`material-symbols-rounded ${styles.icon}`} aria-hidden="true">
        code
      </span>
      <h1>Code</h1>
      <p>Source browser will appear here.</p>
    </section>
  </main>
);
