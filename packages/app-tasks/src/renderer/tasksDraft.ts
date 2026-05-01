import type { SaveTaskInput, TaskItem } from '@tnet/app-tasks/shared/tasksTypes';

export interface TaskDraft {
  id?: string;
  title: string;
  notes: string;
  deadlineDate: string;
  deadlineTime: string;
  category: string;
  reminderMinutesBefore: string;
  recurrenceRule: string;
  linkedEntityId: string;
  sourceUrl: string;
}

export const emptyTaskDraft = (): TaskDraft => ({
  title: '',
  notes: '',
  deadlineDate: '',
  deadlineTime: '',
  category: '',
  reminderMinutesBefore: '',
  recurrenceRule: '',
  linkedEntityId: '',
  sourceUrl: ''
});

export const draftFromTask = (task: TaskItem): TaskDraft => ({
  id: task.id,
  title: task.title,
  notes: task.notes,
  deadlineDate: task.deadlineDate ?? '',
  deadlineTime: task.deadlineTime ?? '',
  category: task.category ?? '',
  reminderMinutesBefore: task.reminderMinutesBefore ? String(task.reminderMinutesBefore) : '',
  recurrenceRule: task.recurrenceRule ?? '',
  linkedEntityId: task.linkedEntityId ?? '',
  sourceUrl: task.sourceUrl ?? ''
});

export const saveInputFromDraft = (draft: TaskDraft): SaveTaskInput => ({
  id: draft.id,
  title: draft.title.trim(),
  notes: draft.notes,
  deadlineDate: draft.deadlineDate || undefined,
  deadlineTime: draft.deadlineDate ? draft.deadlineTime || undefined : undefined,
  category: draft.category.trim() || undefined,
  reminderMinutesBefore: draft.reminderMinutesBefore
    ? Number(draft.reminderMinutesBefore)
    : undefined,
  recurrenceRule: draft.recurrenceRule.trim() || undefined,
  linkedEntityId: draft.linkedEntityId.trim() || undefined,
  sourceUrl: draft.sourceUrl.trim() || undefined
});

export const saveInputFromTask = (task: TaskItem): SaveTaskInput => ({
  id: task.id,
  title: task.title,
  notes: task.notes,
  deadlineDate: task.deadlineDate,
  deadlineTime: task.deadlineTime,
  category: task.category,
  reminderMinutesBefore: task.reminderMinutesBefore,
  recurrenceRule: task.recurrenceRule,
  linkedEntityId: task.linkedEntityId,
  sourceUrl: task.sourceUrl,
  completedAt: task.completedAt
});
