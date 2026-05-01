import type { RequesterVariable } from '@tnet/app-requester/shared/requesterTypes';

interface RequesterVariableSuggestionsProps {
  variables: RequesterVariable[];
}

export const RequesterVariableSuggestions = ({
  variables
}: RequesterVariableSuggestionsProps): React.JSX.Element | null => {
  if (variables.length === 0) return null;

  return (
    <section className="requester-variable-suggestions" aria-label="Variable suggestions">
      <h2>Variables</h2>
      <div>
        {variables.map((variable) => (
          <code key={variable.key}>{`{{${variable.key}}}`}</code>
        ))}
      </div>
    </section>
  );
};
