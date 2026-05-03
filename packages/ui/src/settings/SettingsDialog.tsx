import type { ReactNode } from 'react';
import styles from './SettingsDialog.module.css';

type SettingsFieldValue = string | number | boolean;

interface BaseFieldConfig<TDraft> {
  id: string;
  label: string;
  key: keyof TDraft;
  visible?: boolean | ((draft: TDraft) => boolean);
  helperText?: string;
  messageTone?: 'default' | 'warning';
}

interface TextFieldConfig<TDraft> extends BaseFieldConfig<TDraft> {
  type: 'text' | 'password';
  placeholder?: string;
}

interface NumberFieldConfig<TDraft> extends BaseFieldConfig<TDraft> {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
}

interface CheckboxFieldConfig<TDraft> extends BaseFieldConfig<TDraft> {
  type: 'checkbox';
}

interface SelectFieldConfig<TDraft> extends BaseFieldConfig<TDraft> {
  type: 'select';
  options: ReadonlyArray<{
    value: string;
    label: string;
  }>;
}

export type SettingsFieldConfig<TDraft> =
  | TextFieldConfig<TDraft>
  | NumberFieldConfig<TDraft>
  | CheckboxFieldConfig<TDraft>
  | SelectFieldConfig<TDraft>;

export interface SettingsDialogShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  ariaLabel: string;
  unavailableMessage?: string;
  saveLabel?: string;
  cancelLabel?: string;
  isSaveDisabled?: boolean;
  onSave?: () => Promise<void> | void;
  onSaveError?: (error: unknown) => void;
  children: ReactNode;
}

export interface SettingsCenterPage {
  id: string;
  appId: string;
  appLabel: string;
  appIcon: string;
  scopeLabel: string;
  title: string;
  content: ReactNode;
}

export interface SettingsCenterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  ariaLabel: string;
  pages: ReadonlyArray<SettingsCenterPage>;
  activePageId: string;
  onActivePageChange: (pageId: string) => void;
}

export const SettingsCenterDialog = ({
  isOpen,
  onClose,
  title,
  ariaLabel,
  pages,
  activePageId,
  onActivePageChange
}: SettingsCenterDialogProps): React.JSX.Element | null => {
  if (!isOpen) return null;

  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0];
  const appGroups = pages.reduce<
    Array<{
      appId: string;
      appLabel: string;
      appIcon: string;
      pages: SettingsCenterPage[];
    }>
  >((groups, page) => {
    const group = groups.find((current) => current.appId === page.appId);
    if (group) {
      group.pages.push(page);
      return groups;
    }
    return [
      ...groups,
      {
        appId: page.appId,
        appLabel: page.appLabel,
        appIcon: page.appIcon,
        pages: [page]
      }
    ];
  }, []);

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.centerContent}
        aria-label={ariaLabel}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.centerHeader}>
          <h2>{title}</h2>
        </header>
        <div className={styles.centerBody}>
          <nav className={styles.centerSidebar} aria-label="Settings categories">
            {appGroups.map((group) => (
              <div className={styles.centerAppGroup} key={group.appId}>
                <div className={styles.centerAppLabel}>
                  <span
                    className={`material-symbols-rounded ${styles.centerAppIcon}`}
                    aria-hidden="true"
                  >
                    {group.appIcon}
                  </span>
                  <span>{group.appLabel}</span>
                </div>
                {group.pages.map((page) => (
                  <button
                    type="button"
                    key={page.id}
                    className={`${styles.centerNavButton} ${
                      page.id === activePage?.id ? styles.centerNavButtonActive : ''
                    }`}
                    aria-current={page.id === activePage?.id ? 'page' : undefined}
                    onClick={() => onActivePageChange(page.id)}
                  >
                    {page.scopeLabel}
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <main className={styles.centerMain}>
            {activePage ? (
              <section className={styles.centerPage} aria-label={activePage.title}>
                <h3>{activePage.title}</h3>
                {activePage.content}
              </section>
            ) : null}
          </main>
        </div>
      </section>
    </div>
  );
};

export const SettingsDialogShell = ({
  isOpen,
  onClose,
  title,
  ariaLabel,
  unavailableMessage,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  isSaveDisabled = false,
  onSave,
  onSaveError,
  children
}: SettingsDialogShellProps): React.JSX.Element | null => {
  if (!isOpen) return null;

  const handleSave = (): void => {
    if (!onSave) return;
    Promise.resolve(onSave())
      .then(onClose)
      .catch((error: unknown) => {
        onSaveError?.(error);
      });
  };

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.content}
        aria-label={ariaLabel}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2>{title}</h2>
        {unavailableMessage ? (
          <div className={styles.emptyMessage}>{unavailableMessage}</div>
        ) : (
          children
        )}
        {onSave ? (
          <footer className={styles.actions}>
            <button type="button" className={styles.secondaryButton} onClick={onClose}>
              {cancelLabel}
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={isSaveDisabled || Boolean(unavailableMessage)}
              onClick={handleSave}
            >
              {saveLabel}
            </button>
          </footer>
        ) : null}
      </section>
    </div>
  );
};

export const SettingsSection = ({
  title,
  children
}: {
  title?: string;
  children: ReactNode;
}): React.JSX.Element => (
  <div className={styles.section}>
    {title ? <h3>{title}</h3> : null}
    {children}
  </div>
);

export const SettingsFormItem = ({
  htmlFor,
  label,
  inline = false,
  children
}: {
  htmlFor?: string;
  label: string;
  inline?: boolean;
  children: ReactNode;
}): React.JSX.Element => (
  <label className={`${styles.formItem} ${inline ? styles.formItemInline : ''}`} htmlFor={htmlFor}>
    <span>{label}</span>
    {children}
  </label>
);

export const SettingsActions = ({ children }: { children: ReactNode }): React.JSX.Element => (
  <div className={styles.actions}>{children}</div>
);

export const SettingsEmptyMessage = ({ children }: { children: ReactNode }): React.JSX.Element => (
  <p className={styles.emptyMessage}>{children}</p>
);

export const SettingsSecondaryButton = ({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>): React.JSX.Element => (
  <button type="button" className={styles.secondaryButton} {...props}>
    {children}
  </button>
);

export const SettingsPrimaryButton = ({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>): React.JSX.Element => (
  <button type="button" className={styles.primaryButton} {...props}>
    {children}
  </button>
);

export const SettingsIconButton = ({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>): React.JSX.Element => (
  <button type="button" className={`${styles.iconButton} ${className}`.trim()} {...props}>
    {children}
  </button>
);

export interface SettingsFieldsSectionProps<TDraft> {
  title?: string;
  draft: TDraft;
  fields: ReadonlyArray<SettingsFieldConfig<TDraft>>;
  onFieldChange: <Key extends keyof TDraft>(key: Key, value: TDraft[Key]) => void;
}

export const SettingsFieldsSection = <TDraft,>({
  title,
  draft,
  fields,
  onFieldChange
}: SettingsFieldsSectionProps<TDraft>): React.JSX.Element => (
  <SettingsSection title={title}>
    {fields.map((field) => {
      const isVisible =
        typeof field.visible === 'function' ? field.visible(draft) : (field.visible ?? true);
      if (!isVisible) return null;

      const value = draft[field.key] as SettingsFieldValue;
      const isCheckbox = field.type === 'checkbox';
      return (
        <div key={field.id}>
          <SettingsFormItem htmlFor={field.id} label={field.label} inline={isCheckbox}>
            {renderField(field, value, (nextValue) =>
              onFieldChange(field.key, nextValue as TDraft[keyof TDraft])
            )}
          </SettingsFormItem>
          {field.helperText ? (
            <p className={field.messageTone === 'warning' ? styles.warningText : styles.helperText}>
              {field.helperText}
            </p>
          ) : null}
        </div>
      );
    })}
  </SettingsSection>
);

const renderField = <TDraft,>(
  field: SettingsFieldConfig<TDraft>,
  value: SettingsFieldValue,
  onChange: (value: SettingsFieldValue) => void
): React.JSX.Element => {
  if (field.type === 'select') {
    return (
      <select
        id={field.id}
        value={String(value)}
        onChange={(event) => onChange(event.target.value)}
      >
        {field.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <input
        id={field.id}
        type="checkbox"
        checked={Boolean(value)}
        onChange={(event) => onChange(event.target.checked)}
      />
    );
  }

  if (field.type === 'number') {
    return (
      <input
        id={field.id}
        type="number"
        min={field.min}
        max={field.max}
        step={field.step}
        value={Number(value)}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    );
  }

  return (
    <input
      id={field.id}
      type={field.type}
      placeholder={field.placeholder}
      value={String(value)}
      onChange={(event) => onChange(event.target.value)}
    />
  );
};
