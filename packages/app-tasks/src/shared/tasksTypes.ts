export type CalendarSourceType = 'ics-file' | 'ics-url' | 'caldav' | 'google-calendar';
export type CalendarSourceAuthType = 'none' | 'basic';
export type CalendarSourceItemKind = 'event' | 'task';
export type CalendarSourcePurpose = 'calendar' | 'holiday';

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
  itemKind: CalendarSourceItemKind;
  purpose: CalendarSourcePurpose;
  uri: string;
  color?: string;
  enabled: boolean;
  writeBackEnabled: boolean;
  authType: CalendarSourceAuthType;
  username?: string;
  passwordSecretId?: string;
  googleTokenSecretId?: string;
  lastSyncedAt?: string;
  lastSyncError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveCalendarSourceInput {
  id?: string;
  name: string;
  type: CalendarSourceType;
  itemKind?: CalendarSourceItemKind;
  purpose?: CalendarSourcePurpose;
  uri: string;
  color?: string;
  enabled?: boolean;
  writeBackEnabled?: boolean;
  authType?: CalendarSourceAuthType;
  username?: string;
  password?: string;
  passwordSecretId?: string;
  googleTokenSecretId?: string;
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

export interface SubscribedTaskOccurrence {
  id: string;
  sourceId: string;
  uid: string;
  title: string;
  deadlineDate: string;
  deadlineTime?: string;
  allDay: boolean;
  description?: string;
  recurrenceId?: string;
  lastModified?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListSubscribedTaskOccurrencesRequest {
  startDate: string;
  endDate: string;
  includeCompleted?: boolean;
}

export interface LocalEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  location?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveLocalEventInput {
  id?: string;
  title: string;
  startsAt: string;
  endsAt: string;
  allDay?: boolean;
  location?: string;
  description?: string;
}

export interface ListLocalEventsRequest {
  startDate: string;
  endDate: string;
}
