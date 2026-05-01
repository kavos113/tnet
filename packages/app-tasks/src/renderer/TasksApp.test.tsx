import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TaskItem } from '@tnet/app-tasks/shared/tasksTypes';
import { defaultTasksGlobalSettings } from '@tnet/app-tasks/shared/config';
import { TasksApp } from './TasksApp';
import tasksReducer, { restoreTasks, setTasksCurrentDate } from './tasksSlice';

const saveTask = vi.fn();
const completeTask = vi.fn();
const removeTask = vi.fn();
const listCategories = vi.fn();

interface TasksTestState {
  tasks: ReturnType<typeof tasksReducer>;
}

const createStore = (): EnhancedStore<TasksTestState> =>
  configureStore({
    reducer: {
      tasks: tasksReducer
    }
  });

const task = (overrides: Partial<TaskItem> = {}): TaskItem => ({
  id: 'task-1',
  title: 'Write report',
  notes: '',
  deadlineDate: '2026-05-02',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  ...overrides
});

const installTnetApi = (): void => {
  Object.defineProperty(window, 'tnet', {
    value: {
      tasks: {
        tasks: {
          save: saveTask,
          complete: completeTask,
          remove: removeTask
        },
        categories: {
          list: listCategories
        }
      }
    },
    writable: true
  });
};

describe('TasksApp', () => {
  beforeEach(() => {
    installTnetApi();
    saveTask.mockImplementation(async (request) =>
      task({
        id: `task-${request.title.toLowerCase().replace(/\s+/g, '-')}`,
        title: request.title,
        deadlineDate: request.deadlineDate,
        deadlineTime: request.deadlineTime,
        category: request.category
      })
    );
    completeTask.mockImplementation(async (request) =>
      task({
        completedAt: request.completed ? '2026-05-02T01:00:00.000Z' : undefined
      })
    );
    removeTask.mockResolvedValue(undefined);
    listCategories.mockResolvedValue(['Work']);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('creates deadline-less, date-only, and date-time tasks from quick add', async () => {
    const store = createStore();
    store.dispatch(
      restoreTasks({
        tasks: [],
        categories: ['Work'],
        settings: defaultTasksGlobalSettings()
      })
    );
    store.dispatch(setTasksCurrentDate('2026-05-02'));

    render(
      <Provider store={store}>
        <TasksApp />
      </Provider>
    );

    fireEvent.change(screen.getByLabelText('Task title'), {
      target: { value: 'Inbox item' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() =>
      expect(saveTask).toHaveBeenCalledWith({
        title: 'Inbox item',
        deadlineDate: undefined,
        deadlineTime: undefined,
        category: undefined
      })
    );
    await waitFor(() => expect(screen.getByLabelText('Task title')).toHaveValue(''));

    fireEvent.change(screen.getByLabelText('Task title'), {
      target: { value: 'Date only' }
    });
    fireEvent.change(screen.getByLabelText('Deadline date'), {
      target: { value: '2026-05-02' }
    });
    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: 'Work' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() =>
      expect(saveTask).toHaveBeenLastCalledWith({
        title: 'Date only',
        deadlineDate: '2026-05-02',
        deadlineTime: undefined,
        category: 'Work'
      })
    );
    await waitFor(() => expect(screen.getByLabelText('Task title')).toHaveValue(''));

    fireEvent.change(screen.getByLabelText('Task title'), {
      target: { value: 'Timed' }
    });
    fireEvent.change(screen.getByLabelText('Deadline date'), {
      target: { value: '2026-05-02' }
    });
    fireEvent.change(screen.getByLabelText('Deadline time'), {
      target: { value: '09:30' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() =>
      expect(saveTask).toHaveBeenLastCalledWith({
        title: 'Timed',
        deadlineDate: '2026-05-02',
        deadlineTime: '09:30',
        category: undefined
      })
    );
  });

  it('completes a task from the today list', async () => {
    const store = createStore();
    store.dispatch(
      restoreTasks({
        tasks: [task()],
        categories: ['Work'],
        settings: defaultTasksGlobalSettings()
      })
    );
    store.dispatch(setTasksCurrentDate('2026-05-02'));

    render(
      <Provider store={store}>
        <TasksApp />
      </Provider>
    );

    fireEvent.click(screen.getByLabelText('Complete Write report'));

    await waitFor(() =>
      expect(completeTask).toHaveBeenCalledWith({
        taskId: 'task-1',
        completed: true
      })
    );
    expect(store.getState().tasks.tasks[0].completedAt).toBe('2026-05-02T01:00:00.000Z');
  });
});
