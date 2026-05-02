import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultTasksGlobalSettings } from '@tnet/app-tasks/shared/config';
import { TasksCategoryColorSettings } from './TasksCategoryColorSettings';

describe('TasksCategoryColorSettings', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('updates and clears category colors from color pickers', () => {
    const onChange = vi.fn();
    const draft = defaultTasksGlobalSettings();

    const { rerender } = render(
      <TasksCategoryColorSettings categories={['Work']} draft={draft} onChange={onChange} />
    );

    fireEvent.change(screen.getByLabelText('Work color'), { target: { value: '#00aa88' } });

    expect(onChange).toHaveBeenCalledWith({
      ...draft,
      categoryColors: {
        Work: '#00aa88'
      }
    });

    rerender(
      <TasksCategoryColorSettings
        categories={['Work']}
        draft={{
          ...draft,
          categoryColors: {
            Work: '#00aa88'
          }
        }}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Clear Work color' }));

    expect(onChange).toHaveBeenLastCalledWith({
      ...draft,
      categoryColors: {}
    });
  });
});
