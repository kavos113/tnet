import type { TasksGlobalSettings } from '@tnet/app-tasks/shared/config';
import { SettingsEmptyMessage, SettingsSecondaryButton, SettingsSection } from '@tnet/ui/settings';
import { ColorPickerField } from './ColorPickerField';
import styles from './TasksCategoryColorSettings.module.css';

export interface TasksCategoryColorSettingsProps {
  categories: string[];
  draft: TasksGlobalSettings;
  onChange: (settings: TasksGlobalSettings) => void;
}

export const TasksCategoryColorSettings = ({
  categories,
  draft,
  onChange
}: TasksCategoryColorSettingsProps): React.JSX.Element => {
  const updateCategoryColor = (category: string, color: string | undefined): void => {
    const nextColors = { ...draft.categoryColors };
    if (color) {
      nextColors[category] = color;
    } else {
      delete nextColors[category];
    }
    onChange({ ...draft, categoryColors: nextColors });
  };

  const clearUnusedColors = (): void => {
    const categorySet = new Set(categories);
    const nextColors = Object.fromEntries(
      Object.entries(draft.categoryColors).filter(([category]) => categorySet.has(category))
    );
    onChange({ ...draft, categoryColors: nextColors });
  };

  return (
    <SettingsSection title="Category Colors">
      <div className={styles.section}>
        {categories.length > 0 ? (
          <div className={styles.categoryList}>
            {categories.map((category) => (
              <ColorPickerField
                key={category}
                label={category}
                value={draft.categoryColors[category]}
                onChange={(color) => updateCategoryColor(category, color)}
              />
            ))}
          </div>
        ) : (
          <SettingsEmptyMessage>No categories yet.</SettingsEmptyMessage>
        )}
        {Object.keys(draft.categoryColors).some((category) => !categories.includes(category)) ? (
          <div className={styles.actions}>
            <SettingsSecondaryButton onClick={clearUnusedColors}>
              Clear Unused Colors
            </SettingsSecondaryButton>
          </div>
        ) : null}
      </div>
    </SettingsSection>
  );
};
