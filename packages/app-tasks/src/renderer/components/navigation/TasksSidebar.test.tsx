import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultTasksGlobalSettings } from '@tnet/app-tasks/shared/config';
import tasksReducer, { restoreTasks } from '../../state/tasksSlice';
import { TasksSidebar } from './TasksSidebar';

interface TasksSidebarTestState {
  tasks: ReturnType<typeof tasksReducer>;
}

const createStore = (): EnhancedStore<TasksSidebarTestState> =>
  configureStore({
    reducer: {
      tasks: tasksReducer
    }
  });

describe('TasksSidebar', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows the add subscription action above the sidebar summary', () => {
    const store = createStore();
    const onOpenTasksSettings = vi.fn();
    store.dispatch(
      restoreTasks({
        tasks: [],
        categories: ['Work'],
        settings: defaultTasksGlobalSettings()
      })
    );

    render(
      <Provider store={store}>
        <TasksSidebar onOpenTasksSettings={onOpenTasksSettings} />
      </Provider>
    );

    const sidebar = screen.getByRole('complementary', { name: 'Tasks navigation' });
    const action = within(sidebar).getByRole('button', { name: 'Add subscription' });
    const summary = within(sidebar).getByText('Open Tasks');

    expect(action.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(action);
    expect(onOpenTasksSettings).toHaveBeenCalledTimes(1);
  });
});
