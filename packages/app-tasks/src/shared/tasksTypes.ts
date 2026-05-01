export type CalendarSourceType = 'ics-file' | 'ics-url';

export interface TaskItem {
  id: string;
  title: string;
  notes: string;
  deadlineDate?: string;
  deadlineTime?: string;
  category?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveTaskInput {
  id?: string;
  title: string;
  notes?: string;
  deadlineDate?: string;
  deadlineTime?: string;
  category?: string;
  completedAt?: string;
}

export interface ListTasksRequest {
  startDate?: string;
  endDate?: string;
  category?: string;
  includeCompleted?: boolean;
}

export interface CalendarSource {
  id: string;
  name: string;
  type: CalendarSourceType;
  uri: string;
  color?: string;
  enabled: boolean;
  lastSyncedAt?: string;
  lastSyncError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveCalendarSourceInput {
  id?: string;
  name: string;
  type: CalendarSourceType;
  uri: string;
  color?: string;
  enabled?: boolean;
}

export interface CalendarEventOccurrence {
  id: string;
  sourceId: string;
  uid: string;
  title: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  description?: string;
  location?: string;
  recurrenceId?: string;
  lastModified?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListCalendarOccurrencesRequest {
  startDate: string;
  endDate: string;
}
