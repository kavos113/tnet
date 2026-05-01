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
const listTasks = vi.fn();
const listCategories = vi.fn();
const listOccurrences = vi.fn();

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
          list: listTasks,
          save: saveTask,
          complete: completeTask,
          remove: removeTask
        },
        categories: {
          list: listCategories
        },
        calendarOccurrences: {
          list: listOccurrences
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
        id: request.id ?? `task-${request.title.toLowerCase().replace(/\s+/g, '-')}`,
        title: request.title,
        notes: request.notes ?? '',
        deadlineDate: request.deadlineDate,
        deadlineTime: request.deadlineTime,
        category: request.category,
        reminderMinutesBefore: request.reminderMinutesBefore,
        recurrenceRule: request.recurrenceRule,
        linkedEntityId: request.linkedEntityId,
        sourceUrl: request.sourceUrl
      })
    );
    completeTask.mockImplementation(async (request) =>
      task({
        completedAt: request.completed ? '2026-05-02T01:00:00.000Z' : undefined
      })
    );
    removeTask.mockResolvedValue(undefined);
    listTasks.mockResolvedValue([]);
    listCategories.mockResolvedValue(['Work']);
    listOccurrences.mockResolvedValue([]);
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
      expect(saveTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Inbox item',
          deadlineDate: undefined,
          deadlineTime: undefined,
          category: undefined
        })
      )
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
      expect(saveTask).toHaveBeenLastCalledWith(
        expect.objectContaining({
          title: 'Date only',
          deadlineDate: '2026-05-02',
          deadlineTime: undefined,
          category: 'Work'
        })
      )
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
      expect(saveTask).toHaveBeenLastCalledWith(
        expect.objectContaining({
          title: 'Timed',
          deadlineDate: '2026-05-02',
          deadlineTime: '09:30',
          category: undefined
        })
      )
    );
  });

  it('completes a task from the today list', async () => {
    listTasks.mockResolvedValue([task()]);
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

    await waitFor(() => expect(listTasks).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByLabelText('Complete Write report'));

    await waitFor(() =>
      expect(completeTask).toHaveBeenCalledWith({
        taskId: 'task-1',
        completed: true
      })
    );
    await waitFor(() =>
      expect(store.getState().tasks.tasks[0].completedAt).toBe('2026-05-02T01:00:00.000Z')
    );
  });

  it('updates and deletes tasks from the list controls', async () => {
    listTasks.mockResolvedValue([task()]);
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

    await waitFor(() => expect(listTasks).toHaveBeenCalledTimes(2));
    fireEvent.click(await screen.findByLabelText('Edit Write report'));
    fireEvent.change(screen.getByLabelText('Task title'), {
      target: { value: 'Write final report' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(saveTask).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'task-1',
          title: 'Write final report',
          deadlineDate: '2026-05-02'
        })
      )
    );

    fireEvent.click(await screen.findByLabelText('Delete Write final report'));

    await waitFor(() =>
      expect(removeTask).toHaveBeenCalledWith({
        taskId: 'task-1'
      })
    );
  });

  it('reschedules an undated task by dropping it on a calendar day', async () => {
    const undatedTask = task({
      id: 'task-undated',
      title: 'Inbox task',
      deadlineDate: undefined
    });
    listTasks.mockImplementation(async (request) => (request?.startDate ? [] : [undatedTask]));
    const store = createStore();
    store.dispatch(
      restoreTasks({
        tasks: [undatedTask],
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

    await waitFor(() => expect(listTasks).toHaveBeenCalledTimes(2));
    const dragData = createDataTransfer();
    const row = (await screen.findByText('Inbox task')).closest('li');
    expect(row).toBeTruthy();
    fireEvent.dragStart(row as Element, { dataTransfer: dragData });
    fireEvent.drop(screen.getByRole('gridcell', { name: 'Calendar day 2026-05-03' }), {
      dataTransfer: dragData
    });

    await waitFor(() =>
      expect(saveTask).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'task-undated',
          title: 'Inbox task',
          deadlineDate: '2026-05-03'
        })
      )
    );
  });

  it('prefills the quick-add deadline when a calendar day is selected', async () => {
    const store = createStore();
    store.dispatch(
      restoreTasks({
        tasks: [],
        categories: [],
        settings: defaultTasksGlobalSettings()
      })
    );
    store.dispatch(setTasksCurrentDate('2026-05-02'));

    render(
      <Provider store={store}>
        <TasksApp />
      </Provider>
    );

    fireEvent.click(screen.getByRole('gridcell', { name: 'Calendar day 2026-05-03' }));
    fireEvent.change(screen.getByLabelText('Task title'), {
      target: { value: 'Plan from calendar' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() =>
      expect(saveTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Plan from calendar',
          deadlineDate: '2026-05-03'
        })
      )
    );
  });
});

const createDataTransfer = (): DataTransfer => {
  const data = new Map<string, string>();
  return {
    setData: vi.fn((format: string, value: string) => {
      data.set(format, value);
    }),
    getData: vi.fn((format: string) => data.get(format) ?? '')
  } as unknown as DataTransfer;
};
