// @vitest-environment node
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CalendarEventOccurrenceRepository } from './repository/calendarEventOccurrenceRepository';
import { CalendarSourceRepository } from './repository/calendarSourceRepository';
import { SubscribedTaskOccurrenceRepository } from './repository/subscribedTaskOccurrenceRepository';
import { openTasksDatabase } from './repository/tasksDb';
import type { GoogleCalendarService } from './googleCalendarService';
import { IcalSyncService } from './icalSyncService';
import { createTasksSecretStore } from './tasksSecretStore';

const tempDir = async (name: string): Promise<string> =>
  fs.mkdtemp(path.join(os.tmpdir(), `tnet-tasks-sync-${name}-`));

const icsText = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:event-1
SUMMARY:Planning
DTSTART:20260502T100000Z
DTEND:20260502T110000Z
END:VEVENT
END:VCALENDAR`;

describe('IcalSyncService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.TNET_TASKS_USER_AGENT;
  });

  it('syncs local .ics files and isolates source failures', async () => {
    const userDataDir = await tempDir('files');
    const icsPath = path.join(userDataDir, 'work.ics');
    await fs.writeFile(icsPath, icsText, 'utf-8');

    const database = openTasksDatabase(userDataDir);
    const sourceRepository = new CalendarSourceRepository(database);
    const occurrenceRepository = new CalendarEventOccurrenceRepository(database);
    const subscribedTaskRepository = new SubscribedTaskOccurrenceRepository(database);
    const secretStore = createTasksSecretStore(userDataDir);
    const goodSource = sourceRepository.save({
      name: 'Work',
      type: 'ics-file',
      uri: icsPath
    });
    const badSource = sourceRepository.save({
      name: 'Broken',
      type: 'ics-file',
      uri: path.join(userDataDir, 'missing.ics')
    });

    const result = await new IcalSyncService(
      sourceRepository,
      occurrenceRepository,
      subscribedTaskRepository,
      secretStore
    ).sync();

    expect(result.syncedSourceIds).toEqual([goodSource.id]);
    expect(result.failedSourceIds).toEqual([badSource.id]);
    expect(
      occurrenceRepository.list({
        startDate: '2026-05-01',
        endDate: '2026-05-31'
      })
    ).toEqual([
      expect.objectContaining({
        sourceId: goodSource.id,
        uid: 'event-1',
        title: 'Planning'
      })
    ]);
    expect(sourceRepository.get(badSource.id)?.lastSyncError).toBeTruthy();
    database.close();
  });

  it('uses stored basic auth credentials for iCal URL sources', async () => {
    const userDataDir = await tempDir('basic-auth');
    const database = openTasksDatabase(userDataDir);
    const sourceRepository = new CalendarSourceRepository(database);
    const occurrenceRepository = new CalendarEventOccurrenceRepository(database);
    const subscribedTaskRepository = new SubscribedTaskOccurrenceRepository(database);
    const secretStore = createTasksSecretStore(userDataDir);
    const passwordSecretId = secretStore.saveSecret('secret');
    const source = sourceRepository.save({
      name: 'Private',
      type: 'ics-url',
      uri: 'https://calendar.example/private.ics',
      authType: 'basic',
      username: 'user',
      passwordSecretId
    });
    const fetchMock = vi.fn(
      async (_url: string | URL | Request, _init?: RequestInit) => new Response(icsText)
    );
    vi.stubGlobal('fetch', fetchMock);

    await new IcalSyncService(
      sourceRepository,
      occurrenceRepository,
      subscribedTaskRepository,
      secretStore
    ).sync(source.id);

    const [, init] = fetchMock.mock.calls[0] as [string | URL | Request, RequestInit?];
    const headers = init?.headers;
    expect(headers instanceof Headers).toBe(true);
    if (!(headers instanceof Headers)) throw new Error('Expected fetch headers.');
    expect(headers.get('Authorization')).toBe(
      `Basic ${Buffer.from('user:secret').toString('base64')}`
    );
    expect(sourceRepository.get(source.id)?.lastSyncError).toBeUndefined();
    database.close();
  });

  it('applies the configured Tasks User-Agent to iCal HTTP requests', async () => {
    process.env.TNET_TASKS_USER_AGENT = 'tnet-tasks-test/1.0';
    const userDataDir = await tempDir('user-agent');
    const database = openTasksDatabase(userDataDir);
    const sourceRepository = new CalendarSourceRepository(database);
    const occurrenceRepository = new CalendarEventOccurrenceRepository(database);
    const subscribedTaskRepository = new SubscribedTaskOccurrenceRepository(database);
    const secretStore = createTasksSecretStore(userDataDir);
    const source = sourceRepository.save({
      name: 'Remote',
      type: 'ics-url',
      uri: 'https://calendar.example/work.ics'
    });
    const fetchMock = vi.fn(
      async (_url: string | URL | Request, _init?: RequestInit) => new Response(icsText)
    );
    vi.stubGlobal('fetch', fetchMock);

    await new IcalSyncService(
      sourceRepository,
      occurrenceRepository,
      subscribedTaskRepository,
      secretStore
    ).sync(source.id);

    const [, init] = fetchMock.mock.calls[0] as [string | URL | Request, RequestInit?];
    const headers = init?.headers;
    expect(headers instanceof Headers).toBe(true);
    if (!(headers instanceof Headers)) throw new Error('Expected fetch headers.');
    expect(headers.get('User-Agent')).toBe('tnet-tasks-test/1.0');
    database.close();
  });

  it('does not add a User-Agent header when the env var is unset', async () => {
    const userDataDir = await tempDir('no-user-agent');
    const database = openTasksDatabase(userDataDir);
    const sourceRepository = new CalendarSourceRepository(database);
    const occurrenceRepository = new CalendarEventOccurrenceRepository(database);
    const subscribedTaskRepository = new SubscribedTaskOccurrenceRepository(database);
    const secretStore = createTasksSecretStore(userDataDir);
    const source = sourceRepository.save({
      name: 'Remote',
      type: 'ics-url',
      uri: 'https://calendar.example/work.ics'
    });
    const fetchMock = vi.fn(
      async (_url: string | URL | Request, _init?: RequestInit) => new Response(icsText)
    );
    vi.stubGlobal('fetch', fetchMock);

    await new IcalSyncService(
      sourceRepository,
      occurrenceRepository,
      subscribedTaskRepository,
      secretStore
    ).sync(source.id);

    const [, init] = fetchMock.mock.calls[0] as [string | URL | Request, RequestInit?];
    const headers = init?.headers;
    expect(headers instanceof Headers).toBe(true);
    if (!(headers instanceof Headers)) throw new Error('Expected fetch headers.');
    expect(headers.has('User-Agent')).toBe(false);
    database.close();
  });

  it('keeps write-back disabled by default', async () => {
    const userDataDir = await tempDir('write-back');
    const icsPath = path.join(userDataDir, 'tasks.ics');
    const database = openTasksDatabase(userDataDir);
    const sourceRepository = new CalendarSourceRepository(database);
    const occurrenceRepository = new CalendarEventOccurrenceRepository(database);
    const subscribedTaskRepository = new SubscribedTaskOccurrenceRepository(database);
    const secretStore = createTasksSecretStore(userDataDir);
    const source = sourceRepository.save({
      name: 'Writable',
      type: 'ics-file',
      uri: icsPath
    });

    await expect(
      new IcalSyncService(
        sourceRepository,
        occurrenceRepository,
        subscribedTaskRepository,
        secretStore
      ).writeTask(source.id, {
        id: 'task-1',
        title: 'Export task',
        notes: '',
        deadlineDate: '2026-05-02',
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z'
      })
    ).rejects.toThrow('Calendar write-back is disabled');

    await expect(fs.stat(icsPath)).rejects.toBeTruthy();
    database.close();
  });

  it('syncs task subscriptions to read-only task occurrences', async () => {
    const userDataDir = await tempDir('task-subscription');
    const icsPath = path.join(userDataDir, 'tasks.ics');
    await fs.writeFile(icsPath, icsText, 'utf-8');
    const database = openTasksDatabase(userDataDir);
    const sourceRepository = new CalendarSourceRepository(database);
    const occurrenceRepository = new CalendarEventOccurrenceRepository(database);
    const subscribedTaskRepository = new SubscribedTaskOccurrenceRepository(database);
    const secretStore = createTasksSecretStore(userDataDir);
    const source = sourceRepository.save({
      name: 'Task Feed',
      type: 'ics-file',
      itemKind: 'task',
      uri: icsPath
    });

    await new IcalSyncService(
      sourceRepository,
      occurrenceRepository,
      subscribedTaskRepository,
      secretStore
    ).sync(source.id);

    expect(
      subscribedTaskRepository.list({
        startDate: '2026-05-01',
        endDate: '2026-05-31'
      })
    ).toEqual([
      expect.objectContaining({
        sourceId: source.id,
        uid: 'event-1',
        title: 'Planning',
        deadlineDate: '2026-05-02',
        deadlineTime: '10:00'
      })
    ]);
    expect(
      occurrenceRepository.list({
        startDate: '2026-05-01',
        endDate: '2026-05-31'
      })
    ).toEqual([]);
    database.close();
  });

  it('syncs Google Calendar event sources through the Google service', async () => {
    const userDataDir = await tempDir('google-event-source');
    const database = openTasksDatabase(userDataDir);
    const sourceRepository = new CalendarSourceRepository(database);
    const occurrenceRepository = new CalendarEventOccurrenceRepository(database);
    const subscribedTaskRepository = new SubscribedTaskOccurrenceRepository(database);
    const secretStore = createTasksSecretStore(userDataDir);
    const source = sourceRepository.save({
      name: 'Google',
      type: 'google-calendar',
      uri: 'primary'
    });
    const googleCalendarService = {
      listEvents: vi.fn(async () => [
        {
          id: 'event-1',
          summary: 'Google planning',
          start: { dateTime: '2026-05-02T10:00:00Z' },
          end: { dateTime: '2026-05-02T11:00:00Z' }
        }
      ])
    } as unknown as GoogleCalendarService;

    await new IcalSyncService(
      sourceRepository,
      occurrenceRepository,
      subscribedTaskRepository,
      secretStore,
      googleCalendarService
    ).sync(source.id);

    expect(
      occurrenceRepository.list({
        startDate: '2026-05-01',
        endDate: '2026-05-31'
      })
    ).toEqual([
      expect.objectContaining({
        sourceId: source.id,
        title: 'Google planning'
      })
    ]);
    database.close();
  });

  it('syncs Google Calendar task sources through the Google service', async () => {
    const userDataDir = await tempDir('google-task-source');
    const database = openTasksDatabase(userDataDir);
    const sourceRepository = new CalendarSourceRepository(database);
    const occurrenceRepository = new CalendarEventOccurrenceRepository(database);
    const subscribedTaskRepository = new SubscribedTaskOccurrenceRepository(database);
    const secretStore = createTasksSecretStore(userDataDir);
    const source = sourceRepository.save({
      name: 'Google Tasks Feed',
      type: 'google-calendar',
      itemKind: 'task',
      uri: 'primary'
    });
    const googleCalendarService = {
      listEvents: vi.fn(async () => [
        {
          id: 'task-1',
          summary: 'Google deadline',
          start: { dateTime: '2026-05-02T09:30:00Z' },
          end: { dateTime: '2026-05-02T10:00:00Z' }
        }
      ])
    } as unknown as GoogleCalendarService;

    await new IcalSyncService(
      sourceRepository,
      occurrenceRepository,
      subscribedTaskRepository,
      secretStore,
      googleCalendarService
    ).sync(source.id);

    expect(
      subscribedTaskRepository.list({
        startDate: '2026-05-01',
        endDate: '2026-05-31'
      })
    ).toEqual([
      expect.objectContaining({
        sourceId: source.id,
        title: 'Google deadline',
        deadlineDate: '2026-05-02',
        deadlineTime: '09:30'
      })
    ]);
    database.close();
  });

  it('allows guarded write-back only when explicitly enabled', async () => {
    const userDataDir = await tempDir('enabled-write-back');
    const icsPath = path.join(userDataDir, 'tasks.ics');
    const database = openTasksDatabase(userDataDir);
    const sourceRepository = new CalendarSourceRepository(database);
    const occurrenceRepository = new CalendarEventOccurrenceRepository(database);
    const subscribedTaskRepository = new SubscribedTaskOccurrenceRepository(database);
    const secretStore = createTasksSecretStore(userDataDir);
    const source = sourceRepository.save({
      name: 'Writable',
      type: 'ics-file',
      uri: icsPath,
      writeBackEnabled: true
    });

    await new IcalSyncService(
      sourceRepository,
      occurrenceRepository,
      subscribedTaskRepository,
      secretStore
    ).writeTask(source.id, {
      id: 'task-1',
      title: 'Export task',
      notes: '',
      deadlineDate: '2026-05-02',
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z'
    });

    const calendarText = await fs.readFile(icsPath, 'utf-8');
    expect(calendarText).toContain('UID:tnet-task-task-1');
    expect(calendarText).toContain('SUMMARY:Export task');
    database.close();
  });
});
