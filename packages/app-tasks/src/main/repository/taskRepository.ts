import { randomUUID } from 'node:crypto';
import {
  compareTaskDeadlines,
  isLocalDateString,
  isLocalTimeString
} from '@tnet/app-tasks/shared/dateHelpers';
import type { ListTasksRequest, SaveTaskInput, TaskItem } from '@tnet/app-tasks/shared/tasksTypes';
import type { TasksDatabase } from './tasksDb';

interface TaskRow {
  id: string;
  title: string;
  notes: string;
  deadline_date: string | null;
  deadline_time: string | null;
  category: string | null;
  reminder_minutes_before: number | null;
  recurrence_rule: string | null;
  linked_entity_id: string | null;
  source_url: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

const toTask = (row: TaskRow): TaskItem => ({
  id: row.id,
  title: row.title,
  notes: row.notes,
  deadlineDate: row.deadline_date ?? undefined,
  deadlineTime: row.deadline_time ?? undefined,
  category: row.category ?? undefined,
  reminderMinutesBefore: row.reminder_minutes_before ?? undefined,
  recurrenceRule: row.recurrence_rule ?? undefined,
  linkedEntityId: row.linked_entity_id ?? undefined,
  sourceUrl: row.source_url ?? undefined,
  completedAt: row.completed_at ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const normalizeText = (value: string | undefined): string | undefined => {
  const normalized = value?.trim();
  return normalized || undefined;
};

export class TaskRepository {
  constructor(private readonly database: TasksDatabase) {}

  list(request: ListTasksRequest = {}): TaskItem[] {
    const clauses: string[] = [];
    const params: Record<string, string | number> = {};

    if (!request.includeCompleted) clauses.push('completed_at IS NULL');
    if (request.startDate) {
      clauses.push('deadline_date IS NOT NULL');
      clauses.push('deadline_date >= @startDate');
      params.startDate = request.startDate;
    }
    if (request.endDate) {
      clauses.push('deadline_date IS NOT NULL');
      clauses.push('deadline_date <= @endDate');
      params.endDate = request.endDate;
    }
    if (request.category) {
      clauses.push('category = @category');
      params.category = request.category;
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = this.database
      .prepare(
        `SELECT id, title, notes, deadline_date, deadline_time, category, reminder_minutes_before,
                recurrence_rule, linked_entity_id, source_url, completed_at, created_at, updated_at
         FROM tasks
         ${where}
         ORDER BY deadline_date IS NULL ASC, deadline_date ASC, deadline_time ASC, created_at DESC`
      )
      .all(params) as TaskRow[];

    return rows.map(toTask).sort(compareTaskDeadlines);
  }

  get(taskId: string): TaskItem | null {
    const row = this.database
      .prepare(
        `SELECT id, title, notes, deadline_date, deadline_time, category, reminder_minutes_before,
                recurrence_rule, linked_entity_id, source_url, completed_at, created_at, updated_at
         FROM tasks
         WHERE id = ?`
      )
      .get(taskId) as TaskRow | undefined;
    return row ? toTask(row) : null;
  }

  save(input: SaveTaskInput): TaskItem {
    const now = new Date().toISOString();
    const existing = input.id ? this.get(input.id) : null;
    const taskId = input.id ?? randomUUID();
    const title = normalizeText(input.title) ?? 'Untitled Task';
    const deadlineDate = isLocalDateString(input.deadlineDate) ? input.deadlineDate : undefined;
    const deadlineTime =
      deadlineDate && isLocalTimeString(input.deadlineTime) ? input.deadlineTime : undefined;
    const category = normalizeText(input.category);
    const reminderMinutesBefore =
      input.reminderMinutesBefore && input.reminderMinutesBefore > 0
        ? Math.floor(input.reminderMinutesBefore)
        : undefined;
    const recurrenceRule = normalizeText(input.recurrenceRule);
    const linkedEntityId = normalizeText(input.linkedEntityId);
    const sourceUrl = normalizeText(input.sourceUrl);
    const notes = input.notes ?? '';
    const completedAt = input.completedAt || existing?.completedAt;

    if (existing) {
      this.database
        .prepare(
          `UPDATE tasks
           SET title = @title,
               notes = @notes,
               deadline_date = @deadlineDate,
               deadline_time = @deadlineTime,
               category = @category,
               reminder_minutes_before = @reminderMinutesBefore,
               recurrence_rule = @recurrenceRule,
               linked_entity_id = @linkedEntityId,
               source_url = @sourceUrl,
               completed_at = @completedAt,
               updated_at = @updatedAt
           WHERE id = @id`
        )
        .run({
          id: taskId,
          title,
          notes,
          deadlineDate: deadlineDate ?? null,
          deadlineTime: deadlineTime ?? null,
          category: category ?? null,
          reminderMinutesBefore: reminderMinutesBefore ?? null,
          recurrenceRule: recurrenceRule ?? null,
          linkedEntityId: linkedEntityId ?? null,
          sourceUrl: sourceUrl ?? null,
          completedAt: completedAt ?? null,
          updatedAt: now
        });
    } else {
      this.database
        .prepare(
          `INSERT INTO tasks (
             id, title, notes, deadline_date, deadline_time, category, reminder_minutes_before,
             recurrence_rule, linked_entity_id, source_url, completed_at, created_at, updated_at
           )
           VALUES (
             @id, @title, @notes, @deadlineDate, @deadlineTime, @category, @reminderMinutesBefore,
             @recurrenceRule, @linkedEntityId, @sourceUrl, @completedAt, @createdAt, @updatedAt
           )`
        )
        .run({
          id: taskId,
          title,
          notes,
          deadlineDate: deadlineDate ?? null,
          deadlineTime: deadlineTime ?? null,
          category: category ?? null,
          reminderMinutesBefore: reminderMinutesBefore ?? null,
          recurrenceRule: recurrenceRule ?? null,
          linkedEntityId: linkedEntityId ?? null,
          sourceUrl: sourceUrl ?? null,
          completedAt: completedAt ?? null,
          createdAt: now,
          updatedAt: now
        });
    }

    const saved = this.get(taskId);
    if (!saved) throw new Error(`Task not found after save: ${taskId}`);
    return saved;
  }

  complete(taskId: string, completed: boolean): TaskItem {
    const now = new Date().toISOString();
    this.database
      .prepare('UPDATE tasks SET completed_at = ?, updated_at = ? WHERE id = ?')
      .run(completed ? now : null, now, taskId);
    const task = this.get(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);
    return task;
  }

  remove(taskId: string): void {
    this.database.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
  }

  listCategories(): string[] {
    const rows = this.database
      .prepare(
        `SELECT DISTINCT category
         FROM tasks
         WHERE category IS NOT NULL AND trim(category) != ''
         ORDER BY lower(category) ASC`
      )
      .all() as Array<{ category: string }>;
    return rows.map((row) => row.category);
  }
}
