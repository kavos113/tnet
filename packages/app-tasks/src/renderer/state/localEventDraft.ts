import type { LocalEvent, SaveLocalEventInput } from '@tnet/app-tasks/shared/tasksTypes';

export interface LocalEventDraft {
  id?: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location: string;
  description: string;
}

export const emptyLocalEventDraft = (date: string): LocalEventDraft => ({
  title: '',
  date,
  startTime: '09:00',
  endTime: '10:00',
  allDay: false,
  location: '',
  description: ''
});

export const localEventDraftFromEvent = (event: LocalEvent): LocalEventDraft => ({
  id: event.id,
  title: event.title,
  date: event.startsAt.slice(0, 10),
  startTime: event.allDay ? '09:00' : event.startsAt.slice(11, 16),
  endTime: event.allDay ? '10:00' : event.endsAt.slice(11, 16),
  allDay: event.allDay,
  location: event.location ?? '',
  description: event.description ?? ''
});

export const localEventInputFromDraft = (draft: LocalEventDraft): SaveLocalEventInput => ({
  id: draft.id,
  title: draft.title,
  startsAt: draft.allDay ? `${draft.date}T00:00:00.000` : `${draft.date}T${draft.startTime}:00.000`,
  endsAt: draft.allDay ? `${draft.date}T23:59:59.999` : `${draft.date}T${draft.endTime}:00.000`,
  allDay: draft.allDay,
  location: draft.location.trim() || undefined,
  description: draft.description.trim() || undefined
});
