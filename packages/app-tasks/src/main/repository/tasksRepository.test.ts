// @vitest-environment node
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import type { CalendarEventOccurrence } from '@tnet/app-tasks/shared/tasksTypes';
import { CalendarEventOccurrenceRepository } from './calendarEventOccurrenceRepository';
import { CalendarSourceRepository } from './calendarSourceRepository';
import { TaskRepository } from './taskRepository';
import { openTasksDatabase } from './tasksDb';

const tempDir = async (name: string): Promise<string> =>
  fs.mkdtemp(path.join(os.tmpdir(), `tnet-tasks-${name}-`));

const createRepositories = async (
  name: string
): Promise<{
  database: ReturnType<typeof openTasksDatabase>;
  eventRepository: CalendarEventOccurrenceRepository;
  sourceRepository: CalendarSourceRepository;
  taskRepository: TaskRepository;
  userDataDir: string;
}> => {
  const userDataDir = await tempDir(name);
  const database = openTasksDatabase(userDataDir);
  return {
    database,
    eventRepository: new CalendarEventOccurrenceRepository(database),
    sourceRepository: new CalendarSourceRepository(database),
    taskRepository: new TaskRepository(database),
    userDataDir
  };
};

describe('Tasks repositories', () => {
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
      uri: 'https://example.test/calendar.ics',
      color: '#3874d8'
    });
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
});
