import styles from './ColorPickerField.module.css';

const defaultColor = '#3b82f6';

export interface ColorPickerFieldProps {
  label: string;
  value?: string;
  onChange: (value: string | undefined) => void;
}

export const ColorPickerField = ({
  label,
  value,
  onChange
}: ColorPickerFieldProps): React.JSX.Element => {
  const pickerValue = isHexColor(value) ? value : defaultColor;

  return (
    <label className={styles.field}>
      <span>{label}</span>
      <span className={styles.controls}>
        <input
          aria-label={`${label} color`}
          className={styles.picker}
          type="color"
          value={pickerValue}
          onChange={(event) => onChange(event.target.value.toLowerCase())}
        />
        <span className={styles.value}>{value || 'Default'}</span>
        {value ? (
          <button
            type="button"
            className={styles.clearButton}
            aria-label={`Clear ${label} color`}
            onClick={() => onChange(undefined)}
          >
            Clear
          </button>
        ) : null}
      </span>
    </label>
  );
};

const isHexColor = (value: string | undefined): value is string =>
  Boolean(value && /^#[0-9a-fA-F]{6}$/.test(value));
