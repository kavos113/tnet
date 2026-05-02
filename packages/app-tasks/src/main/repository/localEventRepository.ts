import { randomUUID } from 'node:crypto';
import type {
  ListLocalEventsRequest,
  LocalEvent,
  SaveLocalEventInput
} from '@tnet/app-tasks/shared/tasksTypes';
import type { TasksDatabase } from './tasksDb';

interface LocalEventRow {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  all_day: number;
  location: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const toLocalEvent = (row: LocalEventRow): LocalEvent => ({
  id: row.id,
  title: row.title,
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  allDay: row.all_day === 1,
  location: row.location ?? undefined,
  description: row.description ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const normalizeText = (value: string | undefined): string | undefined => {
  const normalized = value?.trim();
  return normalized || undefined;
};

export class LocalEventRepository {
  constructor(private readonly database: TasksDatabase) {}

  list(request: ListLocalEventsRequest): LocalEvent[] {
    const startAt = `${request.startDate}T00:00:00.000`;
    const endAt = `${request.endDate}T23:59:59.999`;
    const rows = this.database
      .prepare(
        `SELECT id, title, starts_at, ends_at, all_day, location, description, created_at,
                updated_at
         FROM local_events
         WHERE starts_at <= @endAt AND ends_at >= @startAt
         ORDER BY starts_at ASC, title ASC`
      )
      .all({ startAt, endAt }) as LocalEventRow[];
    return rows.map(toLocalEvent);
  }

  get(eventId: string): LocalEvent | null {
    const row = this.database
      .prepare(
        `SELECT id, title, starts_at, ends_at, all_day, location, description, created_at,
                updated_at
         FROM local_events
         WHERE id = ?`
      )
      .get(eventId) as LocalEventRow | undefined;
    return row ? toLocalEvent(row) : null;
  }

  save(input: SaveLocalEventInput): LocalEvent {
    const now = new Date().toISOString();
    const existing = input.id ? this.get(input.id) : null;
    const eventId = input.id ?? randomUUID();
    const title = normalizeText(input.title) ?? 'Untitled Event';
    const startsAt = normalizeText(input.startsAt) ?? now;
    const endsAt = normalizeText(input.endsAt) ?? startsAt;
    const location = normalizeText(input.location);
    const description = normalizeText(input.description);

    if (existing) {
      this.database
        .prepare(
          `UPDATE local_events
           SET title = @title,
               starts_at = @startsAt,
               ends_at = @endsAt,
               all_day = @allDay,
               location = @location,
               description = @description,
               updated_at = @updatedAt
           WHERE id = @id`
        )
        .run({
          id: eventId,
          title,
          startsAt,
          endsAt,
          allDay: input.allDay ? 1 : 0,
          location: location ?? null,
          description: description ?? null,
          updatedAt: now
        });
    } else {
      this.database
        .prepare(
          `INSERT INTO local_events (
             id, title, starts_at, ends_at, all_day, location, description, created_at, updated_at
           )
           VALUES (
             @id, @title, @startsAt, @endsAt, @allDay, @location, @description, @createdAt,
             @updatedAt
           )`
        )
        .run({
          id: eventId,
          title,
          startsAt,
          endsAt,
          allDay: input.allDay ? 1 : 0,
          location: location ?? null,
          description: description ?? null,
          createdAt: now,
          updatedAt: now
        });
    }

    const saved = this.get(eventId);
    if (!saved) throw new Error(`Local event not found after save: ${eventId}`);
    return saved;
  }

  remove(eventId: string): void {
    this.database.prepare('DELETE FROM local_events WHERE id = ?').run(eventId);
  }
}
