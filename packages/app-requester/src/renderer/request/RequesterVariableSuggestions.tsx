import type { RequesterVariable } from '@tnet/app-requester/shared/requesterTypes';
import styles from './RequesterVariableSuggestions.module.css';

interface RequesterVariableSuggestionsProps {
  variables: RequesterVariable[];
}

export const RequesterVariableSuggestions = ({
  variables
}: RequesterVariableSuggestionsProps): React.JSX.Element | null => {
  if (variables.length === 0) return null;

  return (
    <section className={styles.root} aria-label="Variable suggestions">
      <h2 className={styles.title}>Variables</h2>
      <div className={styles.list}>
        {variables.map((variable) => (
          <code className={styles.variable} key={variable.key}>{`{{${variable.key}}}`}</code>
        ))}
      </div>
    </section>
  );
};
