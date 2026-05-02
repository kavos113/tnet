import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
const listSubscribedTasks = vi.fn();
const listLocalEvents = vi.fn();
const saveLocalEvent = vi.fn();
const removeLocalEvent = vi.fn();
let localEventsStore: Array<{
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  location?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}> = [];

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
        },
        subscribedTaskOccurrences: {
          list: listSubscribedTasks
        },
        localEvents: {
          list: listLocalEvents,
          save: saveLocalEvent,
          remove: removeLocalEvent
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
    listSubscribedTasks.mockResolvedValue([]);
    localEventsStore = [];
    listLocalEvents.mockImplementation(async () => localEventsStore);
    saveLocalEvent.mockImplementation(async (request) => {
      const saved = {
        id: request.id ?? 'local-event-saved',
        title: request.title,
        startsAt: request.startsAt,
        endsAt: request.endsAt,
        allDay: request.allDay ?? false,
        location: request.location,
        description: request.description,
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z'
      };
      localEventsStore = [...localEventsStore.filter((event) => event.id !== saved.id), saved];
      return saved;
    });
    removeLocalEvent.mockImplementation(async (request) => {
      localEventsStore = localEventsStore.filter((event) => event.id !== request.eventId);
    });
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
    fireEvent.click(
      within(screen.getByRole('form', { name: 'Quick add' })).getByRole('button', {
        name: 'Add Task'
      })
    );

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
    fireEvent.click(
      within(screen.getByRole('form', { name: 'Quick add' })).getByRole('button', {
        name: 'Add Task'
      })
    );

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
    fireEvent.click(
      within(screen.getByRole('form', { name: 'Quick add' })).getByRole('button', {
        name: 'Add Task'
      })
    );

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
    const taskPanel = await screen.findByRole('dialog', { name: 'Task Details' });
    expect(screen.getByRole('form', { name: 'Quick add' })).toBeInTheDocument();
    fireEvent.change(within(taskPanel).getByLabelText('Detail task title'), {
      target: { value: 'Write final report' }
    });
    fireEvent.click(within(taskPanel).getByRole('button', { name: 'Save Task' }));

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

  it('opens calendar tasks as read-only details and edits from the detail panel', async () => {
    listTasks.mockResolvedValue([task()]);
    const store = createStore();
    store.dispatch(
      restoreTasks({
        tasks: [task()],
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

    await waitFor(() => expect(listTasks).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByRole('button', { name: 'Write report' }));

    let panel = await screen.findByRole('dialog', { name: 'Task Details' });
    expect(panel).toHaveTextContent('Write report');
    expect(within(panel).queryByLabelText('Detail task title')).not.toBeInTheDocument();

    fireEvent.click(within(panel).getByRole('button', { name: 'Edit' }));

    panel = await screen.findByRole('dialog', { name: 'Task Details' });
    expect(within(panel).getByLabelText('Detail task title')).toHaveValue('Write report');
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

    await waitFor(() => expect(listTasks).toHaveBeenCalledTimes(2));
    expect(
      screen.queryByRole('toolbar', { name: 'Calendar date actions' })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('gridcell', { name: 'Calendar day 2026-05-03' }));
    const quickAddForm = screen.getByRole('form', { name: 'Quick add' });
    expect(within(quickAddForm).getByLabelText('Deadline date')).toHaveValue('2026-05-03');
    fireEvent.change(within(quickAddForm).getByLabelText('Task title'), {
      target: { value: 'Plan from calendar' }
    });
    fireEvent.submit(quickAddForm);

    await waitFor(() =>
      expect(saveTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Plan from calendar',
          deadlineDate: '2026-05-03'
        })
      )
    );
  });

  it('uses month view on first render and fades days outside the current month', async () => {
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

    await screen.findByRole('gridcell', { name: 'Calendar day 2026-04-27' });

    expect(screen.getByRole('button', { name: 'Month' }).className).toContain('viewButtonActive');
    expect(screen.getAllByRole('gridcell')).toHaveLength(42);
    expect(screen.getByRole('gridcell', { name: 'Calendar day 2026-04-27' }).className).toContain(
      'cellOutsideMonth'
    );
    expect(
      screen.getByRole('gridcell', { name: 'Calendar day 2026-05-02' }).className
    ).not.toContain('cellOutsideMonth');
    expect(screen.getByRole('gridcell', { name: 'Calendar day 2026-05-02' }).className).toContain(
      'cellSaturday'
    );
    expect(screen.getByRole('gridcell', { name: 'Calendar day 2026-05-03' }).className).toContain(
      'cellHoliday'
    );
  });

  it('reloads the visible range when moving the calendar range', async () => {
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

    await waitFor(() =>
      expect(listOccurrences).toHaveBeenLastCalledWith({
        startDate: '2026-04-27',
        endDate: '2026-06-07'
      })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Next range' }));

    await waitFor(() =>
      expect(listOccurrences).toHaveBeenLastCalledWith({
        startDate: '2026-06-01',
        endDate: '2026-07-12'
      })
    );
    expect(listSubscribedTasks).toHaveBeenLastCalledWith({
      startDate: '2026-06-01',
      endDate: '2026-07-12'
    });
    expect(listLocalEvents).toHaveBeenLastCalledWith({
      startDate: '2026-06-01',
      endDate: '2026-07-12'
    });
  });

  it('shows subscribed task occurrences as read-only calendar items', async () => {
    listSubscribedTasks.mockResolvedValue([
      {
        id: 'subscribed-task-1',
        sourceId: 'source-1',
        uid: 'uid-1',
        title: 'Read-only deadline',
        deadlineDate: '2026-05-02',
        deadlineTime: '10:00',
        allDay: false,
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z'
      }
    ]);
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

    const subscribedTask = await screen.findByRole('button', {
      name: '10:00 Read-only deadline'
    });
    expect(subscribedTask.className).toContain('readOnlyItem');
    expect(subscribedTask).toHaveAttribute('draggable', 'false');
    expect(screen.getByRole('region', { name: 'Today Tasks' })).toHaveTextContent(
      'Read-only deadline'
    );
    expect(screen.getByRole('region', { name: 'Upcoming Deadlines' })).toHaveTextContent(
      'Read-only deadline'
    );
  });

  it('opens subscribed calendar events in a read-only details panel', async () => {
    listOccurrences.mockResolvedValue([
      {
        id: 'occurrence-1',
        sourceId: 'source-1',
        uid: 'uid-1',
        title: 'Subscribed meeting',
        startsAt: '2026-05-02T11:00:00.000',
        endsAt: '2026-05-02T12:00:00.000',
        allDay: false,
        location: 'Room A',
        description: 'Read-only event',
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z'
      }
    ]);
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

    fireEvent.click(await screen.findByRole('button', { name: '11:00 Subscribed meeting' }));

    const panel = await screen.findByRole('dialog', { name: 'Subscribed Event' });
    expect(panel).toHaveTextContent('Room A');
    expect(panel).toHaveTextContent('Read-only event');
    expect(screen.getByRole('region', { name: 'Today Events' })).toHaveTextContent(
      'Subscribed meeting'
    );
    expect(screen.queryByRole('button', { name: 'Save Event' })).not.toBeInTheDocument();
  });

  it('closes the details panel with Escape', async () => {
    listTasks.mockResolvedValue([task()]);
    const store = createStore();
    store.dispatch(
      restoreTasks({
        tasks: [task()],
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

    fireEvent.click(await screen.findByLabelText('Edit Write report'));
    expect(await screen.findByRole('dialog', { name: 'Task Details' })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Task Details' })).not.toBeInTheDocument()
    );
  });

  it('switches editable details between task and event fields', async () => {
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

    fireEvent.change(screen.getByLabelText('Task title'), {
      target: { value: 'Convertible item' }
    });
    fireEvent.click(screen.getByLabelText('Open task details'));

    let panel = await screen.findByRole('dialog', { name: 'Task Details' });
    expect(within(panel).getByLabelText('Detail task title')).toHaveValue('Convertible item');

    fireEvent.change(within(panel).getByLabelText('Detail item type'), {
      target: { value: 'event' }
    });

    panel = await screen.findByRole('dialog', { name: 'Event Details' });
    expect(within(panel).getByLabelText('Event title')).toHaveValue('Convertible item');
    expect(within(panel).getByLabelText('Event date')).toBeInTheDocument();

    fireEvent.change(within(panel).getByLabelText('Detail item type'), {
      target: { value: 'task' }
    });

    panel = await screen.findByRole('dialog', { name: 'Task Details' });
    expect(within(panel).getByLabelText('Detail task title')).toHaveValue('Convertible item');
    expect(within(panel).getByLabelText('Deadline date')).toBeInTheDocument();
  });

  it('renders holiday source all-day events as holiday labels', async () => {
    listOccurrences.mockResolvedValue([
      {
        id: 'holiday-1',
        sourceId: 'holiday-source',
        uid: 'holiday-uid',
        title: 'Constitution Day',
        startsAt: '2026-05-02T00:00:00.000',
        endsAt: '2026-05-02T23:59:59.999',
        allDay: true,
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z'
      }
    ]);
    const store = createStore();
    store.dispatch(
      restoreTasks({
        tasks: [],
        categories: [],
        calendarSources: [
          {
            id: 'holiday-source',
            name: 'Holidays',
            type: 'ics-url',
            itemKind: 'event',
            purpose: 'holiday',
            uri: 'https://example.test/holidays.ics',
            enabled: true,
            writeBackEnabled: false,
            authType: 'none',
            createdAt: '2026-05-01T00:00:00.000Z',
            updatedAt: '2026-05-01T00:00:00.000Z'
          }
        ],
        settings: defaultTasksGlobalSettings()
      })
    );
    store.dispatch(setTasksCurrentDate('2026-05-02'));

    render(
      <Provider store={store}>
        <TasksApp />
      </Provider>
    );

    const holidayCell = await screen.findByRole('gridcell', {
      name: 'Calendar day 2026-05-02'
    });
    expect(holidayCell.className).toContain('cellHoliday');
    expect(holidayCell).toHaveTextContent('Constitution Day');
    expect(screen.queryByRole('button', { name: 'Constitution Day' })).not.toBeInTheDocument();
  });

  it('shows upcoming and completed local tasks in the agenda', async () => {
    const completed = task({
      id: 'task-completed',
      title: 'Finished report',
      completedAt: '2026-05-02T01:00:00.000Z'
    });
    const future = task({
      id: 'task-future',
      title: 'Future report',
      deadlineDate: '2026-05-04'
    });
    listTasks.mockImplementation(async (request) =>
      request?.startDate ? [future] : [completed, future]
    );
    const store = createStore();
    store.dispatch(
      restoreTasks({
        tasks: [completed, future],
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

    await waitFor(() => expect(listTasks).toHaveBeenCalledTimes(2));

    expect(screen.getByRole('region', { name: 'Upcoming Deadlines' })).toHaveTextContent(
      'Future report'
    );
    expect(screen.getByRole('region', { name: 'Completed Tasks' })).toHaveTextContent(
      'Finished report'
    );
  });

  it('limits completed agenda tasks to tasks completed today when configured', async () => {
    const todayCompleted = task({
      id: 'task-completed-today',
      title: 'Finished today',
      completedAt: '2026-05-02T01:00:00.000Z'
    });
    const olderCompleted = task({
      id: 'task-completed-old',
      title: 'Finished earlier',
      completedAt: '2026-05-01T23:00:00.000Z'
    });
    listTasks.mockResolvedValue([todayCompleted, olderCompleted]);
    const store = createStore();
    store.dispatch(
      restoreTasks({
        tasks: [todayCompleted, olderCompleted],
        categories: [],
        settings: {
          ...defaultTasksGlobalSettings(),
          completedTaskScope: 'today'
        }
      })
    );
    store.dispatch(setTasksCurrentDate('2026-05-02'));

    render(
      <Provider store={store}>
        <TasksApp />
      </Provider>
    );

    await waitFor(() => expect(listTasks).toHaveBeenCalledTimes(2));

    const completedRegion = screen.getByRole('region', { name: 'Completed Tasks' });
    expect(completedRegion).toHaveTextContent('Finished today');
    expect(completedRegion).not.toHaveTextContent('Finished earlier');
  });

  it('creates local events from a calendar day selection', async () => {
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

    const quickAddForm = screen.getByRole('form', { name: 'Quick add' });
    fireEvent.change(within(quickAddForm).getByLabelText('Item type'), {
      target: { value: 'event' }
    });
    fireEvent.click(screen.getByRole('gridcell', { name: 'Calendar day 2026-05-03' }));
    expect(within(quickAddForm).getByLabelText('Event date')).toHaveValue('2026-05-03');
    fireEvent.change(within(quickAddForm).getByLabelText('Event title'), {
      target: { value: 'New planning' }
    });
    fireEvent.change(within(quickAddForm).getByLabelText('Start'), { target: { value: '13:00' } });
    fireEvent.change(within(quickAddForm).getByLabelText('End'), { target: { value: '14:00' } });
    fireEvent.click(within(quickAddForm).getByRole('button', { name: 'Add Event' }));

    await waitFor(() =>
      expect(saveLocalEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New planning',
          startsAt: '2026-05-03T13:00:00.000',
          endsAt: '2026-05-03T14:00:00.000'
        })
      )
    );
    await waitFor(() =>
      expect(store.getState().tasks.localEvents).toEqual([
        expect.objectContaining({ title: 'New planning' })
      ])
    );
  });

  it('shows, edits, and deletes local events on the calendar', async () => {
    localEventsStore = [
      {
        id: 'local-event-1',
        title: 'Owned planning',
        startsAt: '2026-05-02T14:00:00.000',
        endsAt: '2026-05-02T15:00:00.000',
        allDay: false,
        location: 'Desk',
        description: 'Prepare agenda',
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z'
      }
    ];
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

    const eventButton = await screen.findByRole('button', { name: '14:00 Owned planning' });
    expect(eventButton.className).toContain('localEvent');
    fireEvent.click(eventButton);

    let panel = await screen.findByRole('dialog', { name: 'Event Details' });
    expect(panel).toHaveTextContent('Owned planning');
    expect(panel).toHaveTextContent('Desk');
    expect(within(panel).queryByRole('region', { name: 'Event editor' })).not.toBeInTheDocument();

    fireEvent.click(within(panel).getByRole('button', { name: 'Edit' }));

    expect(await screen.findByRole('region', { name: 'Event editor' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Event title'), {
      target: { value: 'Owned planning updated' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Event' }));

    await waitFor(() =>
      expect(saveLocalEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'local-event-1',
          title: 'Owned planning updated'
        })
      )
    );

    fireEvent.click(await screen.findByRole('button', { name: '14:00 Owned planning updated' }));
    panel = await screen.findByRole('dialog', { name: 'Event Details' });
    fireEvent.click(within(panel).getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete event' }));

    await waitFor(() =>
      expect(removeLocalEvent).toHaveBeenCalledWith({
        eventId: 'local-event-1'
      })
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
