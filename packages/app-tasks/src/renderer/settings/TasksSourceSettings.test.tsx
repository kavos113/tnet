import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CalendarSource } from '@tnet/app-tasks/shared/tasksTypes';
import tasksReducer, { restoreTasks } from '../state/tasksSlice';
import { TasksSourceSettings } from './TasksSourceSettings';

const listSources = vi.fn();
const saveSource = vi.fn();
const removeSource = vi.fn();
const authorizeGoogle = vi.fn();
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
  purpose: 'calendar',
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
          remove: removeSource,
          authorizeGoogle
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
        purpose: request.purpose ?? 'calendar',
        uri: request.uri,
        color: request.color,
        authType: request.authType ?? 'none',
        username: request.username,
        passwordSecretId: request.password ? 'secret-1' : request.passwordSecretId
      })
    );
    removeSource.mockResolvedValue(undefined);
    authorizeGoogle.mockResolvedValue({});
    syncManual.mockResolvedValue({
      sources: [],
      syncedSourceIds: [],
      failedSourceIds: []
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('saves authenticated iCal sources through the settings form', async () => {
    syncManual.mockResolvedValue({
      sources: [
        source({
          id: 'source-saved',
          name: 'Private',
          itemKind: 'event',
          purpose: 'holiday',
          authType: 'basic',
          passwordSecretId: 'secret-1'
        })
      ],
      syncedSourceIds: ['source-saved'],
      failedSourceIds: []
    });
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
    fireEvent.change(screen.getByLabelText('Color color'), { target: { value: '#ff5500' } });
    fireEvent.change(screen.getByLabelText('Items'), { target: { value: 'task' } });
    fireEvent.change(screen.getByLabelText('Purpose'), { target: { value: 'holiday' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Subscription' }));

    await waitFor(() =>
      expect(saveSource).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Private',
          type: 'ics-url',
          itemKind: 'event',
          purpose: 'holiday',
          uri: 'https://calendar.example/private.ics',
          color: '#ff5500',
          authType: 'basic',
          username: 'user',
          password: 'secret'
        })
      )
    );
    await waitFor(() => expect(syncManual).toHaveBeenCalledWith({ sourceId: 'source-saved' }));
    expect(store.getState().tasks.calendarSources).toEqual([
      expect.objectContaining({
        id: 'source-saved',
        itemKind: 'event',
        purpose: 'holiday',
        authType: 'basic',
        passwordSecretId: 'secret-1'
      })
    ]);
  });

  it('starts Google Calendar authorization for Google sources', async () => {
    const googleSource = source({
      id: 'google-source',
      name: 'Google',
      type: 'google-calendar',
      uri: 'primary'
    });
    listSources.mockResolvedValue([googleSource]);
    authorizeGoogle.mockResolvedValueOnce({
      source: source({
        id: 'google-source',
        name: 'Google',
        type: 'google-calendar',
        uri: 'primary',
        googleTokenSecretId: 'google-token'
      })
    });
    const store = createStore();
    store.dispatch(
      restoreTasks({
        calendarSources: [googleSource]
      })
    );

    render(
      <Provider store={store}>
        <TasksSourceSettings />
      </Provider>
    );

    fireEvent.click(await screen.findByLabelText('Authorize Google'));

    await waitFor(() =>
      expect(authorizeGoogle).toHaveBeenLastCalledWith({ sourceId: 'google-source' })
    );
    expect(store.getState().tasks.calendarSources[0].googleTokenSecretId).toBe('google-token');
  });
});
