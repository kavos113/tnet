import { randomUUID } from 'node:crypto';
import type {
  ListSubscribedTaskOccurrencesRequest,
  SubscribedTaskOccurrence
} from '@tnet/app-tasks/shared/tasksTypes';
import type { TasksDatabase } from './tasksDb';

interface SubscribedTaskOccurrenceRow {
  id: string;
  source_id: string;
  uid: string;
  title: string;
  deadline_date: string;
  deadline_time: string | null;
  all_day: number;
  description: string | null;
  recurrence_id: string | null;
  last_modified: string | null;
  created_at: string;
  updated_at: string;
}

const toSubscribedTaskOccurrence = (
  row: SubscribedTaskOccurrenceRow
): SubscribedTaskOccurrence => ({
  id: row.id,
  sourceId: row.source_id,
  uid: row.uid,
  title: row.title,
  deadlineDate: row.deadline_date,
  deadlineTime: row.deadline_time ?? undefined,
  allDay: row.all_day === 1,
  description: row.description ?? undefined,
  recurrenceId: row.recurrence_id ?? undefined,
  lastModified: row.last_modified ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export class SubscribedTaskOccurrenceRepository {
  constructor(private readonly database: TasksDatabase) {}

  list(request: ListSubscribedTaskOccurrencesRequest): SubscribedTaskOccurrence[] {
    const rows = this.database
      .prepare(
        `SELECT id, source_id, uid, title, deadline_date, deadline_time, all_day, description,
                recurrence_id, last_modified, created_at, updated_at
         FROM subscribed_task_occurrences
         WHERE deadline_date >= @startDate AND deadline_date <= @endDate
         ORDER BY deadline_date ASC, deadline_time ASC, title ASC`
      )
      .all(request) as SubscribedTaskOccurrenceRow[];
    return rows.map(toSubscribedTaskOccurrence);
  }

  replaceForSource(sourceId: string, occurrences: SubscribedTaskOccurrence[]): void {
    const now = new Date().toISOString();
    const transaction = this.database.transaction(() => {
      this.database
        .prepare('DELETE FROM subscribed_task_occurrences WHERE source_id = ?')
        .run(sourceId);

      const insert = this.database.prepare(
        `INSERT INTO subscribed_task_occurrences (
           id, source_id, uid, title, deadline_date, deadline_time, all_day, description,
           recurrence_id, last_modified, created_at, updated_at
         )
         VALUES (
           @id, @sourceId, @uid, @title, @deadlineDate, @deadlineTime, @allDay, @description,
           @recurrenceId, @lastModified, @createdAt, @updatedAt
         )`
      );

      for (const occurrence of occurrences) {
        insert.run({
          id: occurrence.id || randomUUID(),
          sourceId,
          uid: occurrence.uid,
          title: occurrence.title,
          deadlineDate: occurrence.deadlineDate,
          deadlineTime: occurrence.deadlineTime ?? null,
          allDay: occurrence.allDay ? 1 : 0,
          description: occurrence.description ?? null,
          recurrenceId: occurrence.recurrenceId ?? null,
          lastModified: occurrence.lastModified ?? null,
          createdAt: occurrence.createdAt || now,
          updatedAt: now
        });
      }
    });

    transaction();
  }
}
