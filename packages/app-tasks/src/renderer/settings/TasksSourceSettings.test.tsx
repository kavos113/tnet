import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CalendarSource } from '@tnet/app-tasks/shared/tasksTypes';
import tasksReducer, { restoreTasks } from '../tasksSlice';
import { TasksSourceSettings } from './TasksSourceSettings';

const listSources = vi.fn();
const saveSource = vi.fn();
const removeSource = vi.fn();
const syncManual = vi.fn();

interface TasksSourceSettingsTestState {
  tasks: ReturnType<typeof tasksReducer>;
}

const createStore = (): EnhancedStore<TasksSourceSettingsTestState> =>
  configureStore({
    reducer: {
      tasks: tasksReducer
    }
  });

const source = (overrides: Partial<CalendarSource> = {}): CalendarSource => ({
  id: 'source-1',
  name: 'Work',
  type: 'ics-url',
  itemKind: 'event',
  uri: 'https://calendar.example/work.ics',
  enabled: true,
  writeBackEnabled: false,
  authType: 'none',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  ...overrides
});

const installTnetApi = (): void => {
  Object.defineProperty(window, 'tnet', {
    value: {
      tasks: {
        calendarSources: {
          list: listSources,
          save: saveSource,
          remove: removeSource
        },
        sync: {
          manual: syncManual
        }
      }
    },
    writable: true
  });
};

describe('TasksSourceSettings', () => {
  beforeEach(() => {
    installTnetApi();
    listSources.mockResolvedValue([]);
    saveSource.mockImplementation(async (request) =>
      source({
        id: request.id ?? 'source-saved',
        name: request.name,
        type: request.type,
        itemKind: request.itemKind ?? 'event',
        uri: request.uri,
        authType: request.authType ?? 'none',
        username: request.username,
        passwordSecretId: request.password ? 'secret-1' : request.passwordSecretId
      })
    );
    removeSource.mockResolvedValue(undefined);
    syncManual.mockResolvedValue({
      sources: [],
      syncedSourceIds: [],
      failedSourceIds: []
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('saves authenticated iCal sources through the settings form', async () => {
    const store = createStore();
    store.dispatch(restoreTasks({ calendarSources: [] }));

    render(
      <Provider store={store}>
        <TasksSourceSettings />
      </Provider>
    );

    await waitFor(() => expect(listSources).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Private' } });
    fireEvent.change(screen.getByLabelText('URI'), {
      target: { value: 'https://calendar.example/private.ics' }
    });
    fireEvent.change(screen.getByLabelText('Authentication'), { target: { value: 'basic' } });
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'user' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.change(screen.getByLabelText('Items'), { target: { value: 'task' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Subscription' }));

    await waitFor(() =>
      expect(saveSource).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Private',
          type: 'ics-url',
          itemKind: 'task',
          uri: 'https://calendar.example/private.ics',
          authType: 'basic',
          username: 'user',
          password: 'secret'
        })
      )
    );
    expect(store.getState().tasks.calendarSources).toEqual([
      expect.objectContaining({
        id: 'source-saved',
        itemKind: 'task',
        authType: 'basic',
        passwordSecretId: 'secret-1'
      })
    ]);
  });
});
