// @vitest-environment node
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CalendarEventOccurrenceRepository } from './repository/calendarEventOccurrenceRepository';
import { CalendarSourceRepository } from './repository/calendarSourceRepository';
import { openTasksDatabase } from './repository/tasksDb';
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
  });

  it('syncs local .ics files and isolates source failures', async () => {
    const userDataDir = await tempDir('files');
    const icsPath = path.join(userDataDir, 'work.ics');
    await fs.writeFile(icsPath, icsText, 'utf-8');

    const database = openTasksDatabase(userDataDir);
    const sourceRepository = new CalendarSourceRepository(database);
    const occurrenceRepository = new CalendarEventOccurrenceRepository(database);
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

    await new IcalSyncService(sourceRepository, occurrenceRepository, secretStore).sync(source.id);

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

  it('writes deadline tasks back to writable calendar sources', async () => {
    const userDataDir = await tempDir('write-back');
    const icsPath = path.join(userDataDir, 'tasks.ics');
    const database = openTasksDatabase(userDataDir);
    const sourceRepository = new CalendarSourceRepository(database);
    const occurrenceRepository = new CalendarEventOccurrenceRepository(database);
    const secretStore = createTasksSecretStore(userDataDir);
    const source = sourceRepository.save({
      name: 'Writable',
      type: 'ics-file',
      uri: icsPath
    });

    await new IcalSyncService(sourceRepository, occurrenceRepository, secretStore).writeTask(
      source.id,
      {
        id: 'task-1',
        title: 'Export task',
        notes: '',
        deadlineDate: '2026-05-02',
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z'
      }
    );

    const calendarText = await fs.readFile(icsPath, 'utf-8');
    expect(calendarText).toContain('UID:tnet-task-task-1');
    expect(calendarText).toContain('SUMMARY:Export task');
    expect(sourceRepository.get(source.id)?.lastSyncedAt).toBeTruthy();
    database.close();
  });

  it('writes deadline tasks to CalDAV collections with basic auth', async () => {
    const userDataDir = await tempDir('caldav-write-back');
    const database = openTasksDatabase(userDataDir);
    const sourceRepository = new CalendarSourceRepository(database);
    const occurrenceRepository = new CalendarEventOccurrenceRepository(database);
    const secretStore = createTasksSecretStore(userDataDir);
    const passwordSecretId = secretStore.saveSecret('secret');
    const source = sourceRepository.save({
      name: 'CalDAV',
      type: 'caldav',
      uri: 'https://calendar.example/calendars/user/work/',
      authType: 'basic',
      username: 'user',
      passwordSecretId
    });
    const fetchMock = vi.fn(
      async (_url: string | URL | Request, _init?: RequestInit) => new Response('')
    );
    vi.stubGlobal('fetch', fetchMock);

    await new IcalSyncService(sourceRepository, occurrenceRepository, secretStore).writeTask(
      source.id,
      {
        id: 'task-1',
        title: 'CalDAV task',
        notes: '',
        deadlineDate: '2026-05-02',
        deadlineTime: '09:30',
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z'
      }
    );

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit?];
    expect(url).toBe('https://calendar.example/calendars/user/work/tnet-task-task-1.ics');
    expect(init?.method).toBe('PUT');
    expect(String(init?.body)).toContain('SUMMARY:CalDAV task');
    database.close();
  });
});
