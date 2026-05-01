export type CalendarSourceType = 'ics-file' | 'ics-url' | 'caldav';
export type CalendarSourceAuthType = 'none' | 'basic';

export interface TaskItem {
  id: string;
  title: string;
  notes: string;
  deadlineDate?: string;
  deadlineTime?: string;
  category?: string;
  reminderMinutesBefore?: number;
  recurrenceRule?: string;
  linkedEntityId?: string;
  sourceUrl?: string;
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
  reminderMinutesBefore?: number;
  recurrenceRule?: string;
  linkedEntityId?: string;
  sourceUrl?: string;
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
  authType: CalendarSourceAuthType;
  username?: string;
  passwordSecretId?: string;
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
  authType?: CalendarSourceAuthType;
  username?: string;
  password?: string;
  passwordSecretId?: string;
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
