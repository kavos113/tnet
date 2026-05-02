import type {
  CalendarSource,
  CalendarSourceAuthType,
  CalendarSourceItemKind,
  CalendarSourcePurpose,
  CalendarSourceType
} from '@tnet/app-tasks/shared/tasksTypes';

export interface SourceDraft {
  id?: string;
  name: string;
  type: CalendarSourceType;
  itemKind: CalendarSourceItemKind;
  purpose: CalendarSourcePurpose;
  uri: string;
  color: string;
  enabled: boolean;
  authType: CalendarSourceAuthType;
  username: string;
  password: string;
  passwordSecretId?: string;
}

export const emptySourceDraft = (): SourceDraft => ({
  name: '',
  type: 'ics-url',
  itemKind: 'event',
  purpose: 'calendar',
  uri: '',
  color: '',
  enabled: true,
  authType: 'none',
  username: '',
  password: ''
});

export const sourceDraftFromSource = (source: CalendarSource): SourceDraft => ({
  id: source.id,
  name: source.name,
  type: source.type,
  itemKind: source.itemKind,
  purpose: source.purpose,
  uri: source.uri,
  color: source.color ?? '',
  enabled: source.enabled,
  authType: source.authType,
  username: source.username ?? '',
  password: '',
  passwordSecretId: source.passwordSecretId
});
