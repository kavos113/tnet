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
  completed_at: string | null;
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
  completedAt: row.completed_at ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export class SubscribedTaskOccurrenceRepository {
  constructor(private readonly database: TasksDatabase) {}

  list(request: ListSubscribedTaskOccurrencesRequest): SubscribedTaskOccurrence[] {
    const completedClause = request.includeCompleted ? '' : 'AND completed.completed_at IS NULL';
    const rows = this.database
      .prepare(
        `SELECT occurrences.id,
                occurrences.source_id,
                occurrences.uid,
                occurrences.title,
                occurrences.deadline_date,
                occurrences.deadline_time,
                occurrences.all_day,
                occurrences.description,
                occurrences.recurrence_id,
                occurrences.last_modified,
                completed.completed_at,
                occurrences.created_at,
                occurrences.updated_at
         FROM subscribed_task_occurrences occurrences
         LEFT JOIN subscribed_task_completion_overrides completed
           ON completed.source_id = occurrences.source_id
          AND completed.uid = occurrences.uid
          AND completed.deadline_date = occurrences.deadline_date
          AND completed.deadline_time = COALESCE(occurrences.deadline_time, '')
          AND completed.recurrence_id = COALESCE(occurrences.recurrence_id, '')
         WHERE occurrences.deadline_date >= @startDate
           AND occurrences.deadline_date <= @endDate
           ${completedClause}
         ORDER BY occurrences.deadline_date ASC, occurrences.deadline_time ASC, occurrences.title ASC`
      )
      .all(request) as SubscribedTaskOccurrenceRow[];
    return rows.map(toSubscribedTaskOccurrence);
  }

  get(occurrenceId: string): SubscribedTaskOccurrence | null {
    const row = this.database
      .prepare(
        `SELECT occurrences.id,
                occurrences.source_id,
                occurrences.uid,
                occurrences.title,
                occurrences.deadline_date,
                occurrences.deadline_time,
                occurrences.all_day,
                occurrences.description,
                occurrences.recurrence_id,
                occurrences.last_modified,
                completed.completed_at,
                occurrences.created_at,
                occurrences.updated_at
         FROM subscribed_task_occurrences occurrences
         LEFT JOIN subscribed_task_completion_overrides completed
           ON completed.source_id = occurrences.source_id
          AND completed.uid = occurrences.uid
          AND completed.deadline_date = occurrences.deadline_date
          AND completed.deadline_time = COALESCE(occurrences.deadline_time, '')
          AND completed.recurrence_id = COALESCE(occurrences.recurrence_id, '')
         WHERE occurrences.id = ?`
      )
      .get(occurrenceId) as SubscribedTaskOccurrenceRow | undefined;
    return row ? toSubscribedTaskOccurrence(row) : null;
  }

  complete(occurrenceId: string, completed: boolean): SubscribedTaskOccurrence {
    const occurrence = this.get(occurrenceId);
    if (!occurrence) throw new Error(`Subscribed task occurrence not found: ${occurrenceId}`);

    const deadlineTime = occurrence.deadlineTime ?? '';
    const recurrenceId = occurrence.recurrenceId ?? '';
    if (completed) {
      const now = new Date().toISOString();
      this.database
        .prepare(
          `INSERT INTO subscribed_task_completion_overrides (
             source_id, uid, deadline_date, deadline_time, recurrence_id, completed_at, updated_at
           )
           VALUES (
             @sourceId, @uid, @deadlineDate, @deadlineTime, @recurrenceId, @completedAt, @updatedAt
           )
           ON CONFLICT(source_id, uid, deadline_date, deadline_time, recurrence_id)
           DO UPDATE SET completed_at = excluded.completed_at, updated_at = excluded.updated_at`
        )
        .run({
          sourceId: occurrence.sourceId,
          uid: occurrence.uid,
          deadlineDate: occurrence.deadlineDate,
          deadlineTime,
          recurrenceId,
          completedAt: now,
          updatedAt: now
        });
    } else {
      this.database
        .prepare(
          `DELETE FROM subscribed_task_completion_overrides
           WHERE source_id = @sourceId
             AND uid = @uid
             AND deadline_date = @deadlineDate
             AND deadline_time = @deadlineTime
             AND recurrence_id = @recurrenceId`
        )
        .run({
          sourceId: occurrence.sourceId,
          uid: occurrence.uid,
          deadlineDate: occurrence.deadlineDate,
          deadlineTime,
          recurrenceId
        });
    }

    const updated = this.get(occurrenceId);
    if (!updated) throw new Error(`Subscribed task occurrence not found: ${occurrenceId}`);
    return updated;
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
