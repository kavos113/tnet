// @vitest-environment node
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import type {
  CalendarEventOccurrence,
  SubscribedTaskOccurrence
} from '@tnet/app-tasks/shared/tasksTypes';
import { CalendarEventOccurrenceRepository } from './calendarEventOccurrenceRepository';
import { CalendarSourceRepository } from './calendarSourceRepository';
import { LocalEventRepository } from './localEventRepository';
import { SubscribedTaskOccurrenceRepository } from './subscribedTaskOccurrenceRepository';
import { TaskRepository } from './taskRepository';
import { openTasksDatabase } from './tasksDb';
import { tasksDatabasePath } from '../tasksPaths';

const tempDir = async (name: string): Promise<string> =>
  fs.mkdtemp(path.join(os.tmpdir(), `tnet-tasks-${name}-`));

const createRepositories = async (
  name: string
): Promise<{
  database: ReturnType<typeof openTasksDatabase>;
  eventRepository: CalendarEventOccurrenceRepository;
  localEventRepository: LocalEventRepository;
  sourceRepository: CalendarSourceRepository;
  subscribedTaskRepository: SubscribedTaskOccurrenceRepository;
  taskRepository: TaskRepository;
  userDataDir: string;
}> => {
  const userDataDir = await tempDir(name);
  const database = openTasksDatabase(userDataDir);
  return {
    database,
    eventRepository: new CalendarEventOccurrenceRepository(database),
    localEventRepository: new LocalEventRepository(database),
    sourceRepository: new CalendarSourceRepository(database),
    subscribedTaskRepository: new SubscribedTaskOccurrenceRepository(database),
    taskRepository: new TaskRepository(database),
    userDataDir
  };
};

describe('Tasks repositories', () => {
  it('opens legacy databases and fills compatibility schema gaps', async () => {
    const userDataDir = await tempDir('legacy-schema');
    const databasePath = tasksDatabasePath(userDataDir);
    await fs.mkdir(path.dirname(databasePath), { recursive: true });
    const legacyDatabase = new Database(databasePath);
    legacyDatabase.exec(`
      CREATE TABLE IF NOT EXISTS tasks_schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        notes TEXT NOT NULL,
        deadline_date TEXT,
        deadline_time TEXT,
        category TEXT,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS calendar_sources (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        uri TEXT NOT NULL,
        color TEXT,
        enabled INTEGER NOT NULL,
        last_synced_at TEXT,
        last_sync_error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      INSERT OR IGNORE INTO tasks_schema_migrations (version, applied_at)
      VALUES (1, datetime('now'));
    `);
    legacyDatabase.close();

    const database = openTasksDatabase(userDataDir);

    expect(listColumns(database, 'tasks')).toEqual(
      expect.arrayContaining(['reminder_minutes_before', 'recurrence_rule', 'linked_entity_id'])
    );
    expect(listColumns(database, 'calendar_sources')).toEqual(
      expect.arrayContaining(['item_kind', 'purpose', 'auth_type', 'google_token_secret_id'])
    );
    expect(
      database
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'subscribed_task_completion_overrides'"
        )
        .get()
    ).toBeTruthy();
    database.close();
  });

  it('creates the database and stores deadline-less, date-only, and date-time tasks', async () => {
    const { database, taskRepository, userDataDir } = await createRepositories('tasks');
    const noDeadline = taskRepository.save({ title: 'Inbox task', category: 'Admin' });
    const dateOnly = taskRepository.save({
      title: 'Submit report',
      deadlineDate: '2026-05-02',
      category: 'Work'
    });
    const dateTime = taskRepository.save({
      title: 'Call',
      deadlineDate: '2026-05-02',
      deadlineTime: '09:30',
      category: 'Work'
    });

    expect(taskRepository.list().map((task) => task.id)).toEqual([
      dateOnly.id,
      dateTime.id,
      noDeadline.id
    ]);
    expect(taskRepository.list({ startDate: '2026-05-02', endDate: '2026-05-02' })).toEqual([
      dateOnly,
      dateTime
    ]);
    expect(taskRepository.listCategories()).toEqual(['Admin', 'Work']);
    await expect(fs.stat(path.join(userDataDir, 'tasks', 'tasks.db'))).resolves.toBeTruthy();
    database.close();
  });

  it('updates, completes, uncompletes, and removes tasks', async () => {
    const { database, taskRepository } = await createRepositories('task-actions');
    const saved = taskRepository.save({ title: 'Draft', category: 'Work' });
    const updated = taskRepository.save({
      ...saved,
      title: 'Publish',
      deadlineDate: '2026-05-03',
      category: ''
    });

    expect(updated).toMatchObject({
      id: saved.id,
      title: 'Publish',
      deadlineDate: '2026-05-03',
      category: undefined
    });

    const completed = taskRepository.complete(saved.id, true);
    expect(completed.completedAt).toBeTruthy();
    expect(taskRepository.list()).toEqual([]);
    expect(taskRepository.list({ includeCompleted: true })).toHaveLength(1);

    expect(taskRepository.complete(saved.id, false).completedAt).toBeUndefined();
    taskRepository.remove(saved.id);
    expect(taskRepository.list({ includeCompleted: true })).toEqual([]);
    database.close();
  });

  it('stores calendar sources and occurrence range queries', async () => {
    const { database, eventRepository, sourceRepository } =
      await createRepositories('calendar-events');
    const source = sourceRepository.save({
      name: 'Holidays',
      type: 'ics-url',
      itemKind: 'event',
      purpose: 'holiday',
      uri: 'https://example.test/calendar.ics',
      color: '#3874d8'
    });
    expect(source.purpose).toBe('holiday');
    const occurrences: CalendarEventOccurrence[] = [
      {
        id: 'event-1',
        sourceId: source.id,
        uid: 'uid-1',
        title: 'Planning',
        startsAt: '2026-05-02T10:00:00.000',
        endsAt: '2026-05-02T11:00:00.000',
        allDay: false,
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z'
      },
      {
        id: 'event-2',
        sourceId: source.id,
        uid: 'uid-2',
        title: 'Outside range',
        startsAt: '2026-06-02T10:00:00.000',
        endsAt: '2026-06-02T11:00:00.000',
        allDay: false,
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z'
      }
    ];

    eventRepository.replaceForSource(source.id, occurrences);

    expect(sourceRepository.list()).toEqual([source]);
    expect(
      eventRepository.list({
        startDate: '2026-05-01',
        endDate: '2026-05-31'
      })
    ).toEqual([
      expect.objectContaining({
        id: occurrences[0].id,
        sourceId: source.id,
        uid: 'uid-1',
        title: 'Planning'
      })
    ]);

    sourceRepository.remove(source.id);
    expect(sourceRepository.list()).toEqual([]);
    expect(eventRepository.list({ startDate: '2026-05-01', endDate: '2026-05-31' })).toEqual([]);
    database.close();
  });

  it('stores subscribed task occurrences and local events', async () => {
    const { database, localEventRepository, sourceRepository, subscribedTaskRepository } =
      await createRepositories('local-events');
    const source = sourceRepository.save({
      name: 'Task Feed',
      type: 'ics-url',
      itemKind: 'task',
      uri: 'https://example.test/tasks.ics'
    });
    const subscribedTasks: SubscribedTaskOccurrence[] = [
      {
        id: 'subscribed-task-1',
        sourceId: source.id,
        uid: 'uid-1',
        title: 'External deadline',
        deadlineDate: '2026-05-02',
        deadlineTime: '09:30',
        allDay: false,
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z'
      }
    ];

    subscribedTaskRepository.replaceForSource(source.id, subscribedTasks);
    const localEvent = localEventRepository.save({
      title: 'Planning',
      startsAt: '2026-05-02T10:00:00.000',
      endsAt: '2026-05-02T11:00:00.000',
      location: 'Room 1',
      description: 'Discuss roadmap'
    });

    expect(
      subscribedTaskRepository.list({
        startDate: '2026-05-01',
        endDate: '2026-05-31'
      })
    ).toEqual([expect.objectContaining({ title: 'External deadline' })]);
    const completed = subscribedTaskRepository.complete('subscribed-task-1', true);
    expect(completed.completedAt).toBeTruthy();
    expect(
      subscribedTaskRepository.list({
        startDate: '2026-05-01',
        endDate: '2026-05-31'
      })
    ).toEqual([]);
    expect(
      subscribedTaskRepository.list({
        startDate: '2026-05-01',
        endDate: '2026-05-31',
        includeCompleted: true
      })
    ).toEqual([
      expect.objectContaining({ title: 'External deadline', completedAt: completed.completedAt })
    ]);
    subscribedTaskRepository.replaceForSource(source.id, subscribedTasks);
    expect(
      subscribedTaskRepository.list({
        startDate: '2026-05-01',
        endDate: '2026-05-31',
        includeCompleted: true
      })
    ).toEqual([
      expect.objectContaining({ title: 'External deadline', completedAt: completed.completedAt })
    ]);
    expect(
      subscribedTaskRepository.complete('subscribed-task-1', false).completedAt
    ).toBeUndefined();
    expect(
      localEventRepository.list({
        startDate: '2026-05-01',
        endDate: '2026-05-31'
      })
    ).toEqual([
      expect.objectContaining({
        id: localEvent.id,
        title: 'Planning',
        location: 'Room 1'
      })
    ]);

    const updated = localEventRepository.save({
      ...localEvent,
      title: 'Updated planning'
    });
    expect(updated.title).toBe('Updated planning');
    localEventRepository.remove(localEvent.id);
    expect(
      localEventRepository.list({
        startDate: '2026-05-01',
        endDate: '2026-05-31'
      })
    ).toEqual([]);
    database.close();
  });
});

const listColumns = (database: ReturnType<typeof openTasksDatabase>, table: string): string[] =>
  (
    database.prepare(`PRAGMA table_info(${table})`).all() as Array<{
      name: string;
    }>
  ).map((row) => row.name);
