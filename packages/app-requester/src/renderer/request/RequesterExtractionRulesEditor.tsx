import type { RequesterExtractionRule } from '@tnet/app-requester/shared/requesterTypes';
import styles from './RequesterExtractionRulesEditor.module.css';

interface RequesterExtractionRulesEditorProps {
  rules: RequesterExtractionRule[];
  onChange: (rules: RequesterExtractionRule[]) => void;
}

export const RequesterExtractionRulesEditor = ({
  rules,
  onChange
}: RequesterExtractionRulesEditorProps): React.JSX.Element => {
  const updateRule = (ruleId: string, patch: Partial<RequesterExtractionRule>): void => {
    onChange(rules.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)));
  };

  return (
    <section className={styles.root} aria-label="Extraction rules">
      <header className={styles.header}>
        <h2 className={styles.title}>Extraction</h2>
        <button
          type="button"
          className="open-folder-button"
          onClick={() => onChange([...rules, createExtractionRule()])}
        >
          Add
        </button>
      </header>
      <div className={styles.table}>
        {rules.map((rule) => (
          <div className={styles.row} key={rule.id}>
            <input
              type="checkbox"
              aria-label="Extraction enabled"
              checked={rule.enabled}
              onChange={(event) => updateRule(rule.id, { enabled: event.target.checked })}
            />
            <select
              aria-label="Extraction source"
              value={rule.source}
              onChange={(event) =>
                updateRule(rule.id, {
                  source: event.target.value as RequesterExtractionRule['source']
                })
              }
            >
              <option value="json-body">json-body</option>
              <option value="header">header</option>
            </select>
            <input
              aria-label="Extraction expression"
              placeholder={rule.source === 'header' ? 'x-request-id' : '$.token'}
              value={rule.expression}
              onChange={(event) => updateRule(rule.id, { expression: event.target.value })}
            />
            <input
              aria-label="Extraction target variable"
              placeholder="variableName"
              value={rule.targetVariable}
              onChange={(event) => updateRule(rule.id, { targetVariable: event.target.value })}
            />
            <button
              type="button"
              className="sidebar-icon-button material-icons-round"
              aria-label="Remove extraction rule"
              onClick={() => onChange(rules.filter((item) => item.id !== rule.id))}
            >
              close
            </button>
          </div>
        ))}
        {rules.length === 0 ? <p className={styles.empty}>No extraction rules.</p> : null}
      </div>
    </section>
  );
};

const createExtractionRule = (): RequesterExtractionRule => ({
  id: crypto.randomUUID(),
  enabled: true,
  source: 'json-body',
  expression: '$.',
  targetVariable: ''
});
