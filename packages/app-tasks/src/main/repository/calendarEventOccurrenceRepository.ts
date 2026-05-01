import { randomUUID } from 'node:crypto';
import type {
  CalendarEventOccurrence,
  ListCalendarOccurrencesRequest
} from '@tnet/app-tasks/shared/tasksTypes';
import type { TasksDatabase } from './tasksDb';

interface CalendarEventOccurrenceRow {
  id: string;
  source_id: string;
  uid: string;
  title: string;
  starts_at: string;
  ends_at: string;
  all_day: number;
  description: string | null;
  location: string | null;
  recurrence_id: string | null;
  last_modified: string | null;
  created_at: string;
  updated_at: string;
}

const toOccurrence = (row: CalendarEventOccurrenceRow): CalendarEventOccurrence => ({
  id: row.id,
  sourceId: row.source_id,
  uid: row.uid,
  title: row.title,
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  allDay: row.all_day === 1,
  description: row.description ?? undefined,
  location: row.location ?? undefined,
  recurrenceId: row.recurrence_id ?? undefined,
  lastModified: row.last_modified ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export class CalendarEventOccurrenceRepository {
  constructor(private readonly database: TasksDatabase) {}

  list(request: ListCalendarOccurrencesRequest): CalendarEventOccurrence[] {
    const startAt = `${request.startDate}T00:00:00.000`;
    const endAt = `${request.endDate}T23:59:59.999`;
    const rows = this.database
      .prepare(
        `SELECT id, source_id, uid, title, starts_at, ends_at, all_day, description, location,
                recurrence_id, last_modified, created_at, updated_at
         FROM calendar_event_occurrences
         WHERE starts_at <= @endAt AND ends_at >= @startAt
         ORDER BY starts_at ASC, title ASC`
      )
      .all({ startAt, endAt }) as CalendarEventOccurrenceRow[];
    return rows.map(toOccurrence);
  }

  replaceForSource(sourceId: string, occurrences: CalendarEventOccurrence[]): void {
    const now = new Date().toISOString();
    const transaction = this.database.transaction(() => {
      this.database
        .prepare('DELETE FROM calendar_event_occurrences WHERE source_id = ?')
        .run(sourceId);

      const insert = this.database.prepare(
        `INSERT INTO calendar_event_occurrences (
           id, source_id, uid, title, starts_at, ends_at, all_day, description, location,
           recurrence_id, last_modified, created_at, updated_at
         )
         VALUES (
           @id, @sourceId, @uid, @title, @startsAt, @endsAt, @allDay, @description, @location,
           @recurrenceId, @lastModified, @createdAt, @updatedAt
         )`
      );

      for (const occurrence of occurrences) {
        insert.run({
          id: occurrence.id || randomUUID(),
          sourceId,
          uid: occurrence.uid,
          title: occurrence.title,
          startsAt: occurrence.startsAt,
          endsAt: occurrence.endsAt,
          allDay: occurrence.allDay ? 1 : 0,
          description: occurrence.description ?? null,
          location: occurrence.location ?? null,
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
