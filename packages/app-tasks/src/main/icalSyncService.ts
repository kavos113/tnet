import fs from 'fs/promises';
import {
  extractCalDavCalendarData,
  expandIcalEvents,
  parseIcalCalendar,
  taskToIcalCalendar,
  taskToIcalUid
} from '@tnet/app-tasks/shared/ical';
import { getOccurrenceCacheRange } from '@tnet/app-tasks/shared/calendarView';
import type { CalendarSource, TaskItem } from '@tnet/app-tasks/shared/tasksTypes';
import type { CalendarEventOccurrenceRepository, CalendarSourceRepository } from './repository';
import type { TasksSecretStore } from './tasksSecretStore';

export interface SyncTasksCalendarsResult {
  sources: CalendarSource[];
  syncedSourceIds: string[];
  failedSourceIds: string[];
}

export class IcalSyncService {
  constructor(
    private readonly sourceRepository: CalendarSourceRepository,
    private readonly occurrenceRepository: CalendarEventOccurrenceRepository,
    private readonly secretStore: TasksSecretStore
  ) {}

  async sync(sourceId?: string): Promise<SyncTasksCalendarsResult> {
    const sources = this.sourceRepository
      .list()
      .filter((source) => source.enabled)
      .filter((source) => !sourceId || source.id === sourceId);
    const syncedSourceIds: string[] = [];
    const failedSourceIds: string[] = [];

    for (const source of sources) {
      try {
        await this.syncSource(source);
        syncedSourceIds.push(source.id);
      } catch (error) {
        failedSourceIds.push(source.id);
        this.sourceRepository.saveSyncResult(
          source.id,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    return {
      sources: this.sourceRepository.list(),
      syncedSourceIds,
      failedSourceIds
    };
  }

  async writeTask(sourceId: string, task: TaskItem): Promise<CalendarSource> {
    const source = this.sourceRepository.get(sourceId);
    if (!source) throw new Error(`Calendar source not found: ${sourceId}`);
    const calendarText = taskToIcalCalendar(task);
    const uid = taskToIcalUid(task);

    if (source.type === 'ics-file') {
      await upsertIcsFileEvent(source.uri, uid, calendarText);
      return this.sourceRepository.saveSyncResult(source.id);
    }

    if (source.type === 'caldav') {
      await this.fetchText(resolveCalDavEventUrl(source.uri, uid), source, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8'
        },
        body: calendarText
      });
      return this.sourceRepository.saveSyncResult(source.id);
    }

    throw new Error('iCal URL sources are read-only.');
  }

  private async syncSource(source: CalendarSource): Promise<void> {
    const texts = await this.readSource(source);
    const { startDate, endDate } = getOccurrenceCacheRange();
    const events = texts.flatMap(parseIcalCalendar);
    const occurrences = expandIcalEvents({
      events,
      sourceId: source.id,
      startDate,
      endDate
    });
    this.occurrenceRepository.replaceForSource(source.id, occurrences);
    this.sourceRepository.saveSyncResult(source.id);
  }

  private async readSource(source: CalendarSource): Promise<string[]> {
    if (source.type === 'ics-file') return [await fs.readFile(source.uri, 'utf-8')];
    if (source.type === 'caldav') return this.readCalDavSource(source);
    return [await this.fetchText(source.uri, source)];
  }

  private async readCalDavSource(source: CalendarSource): Promise<string[]> {
    const responseText = await this.fetchText(source.uri, source, {
      method: 'REPORT',
      headers: {
        Depth: '1',
        'Content-Type': 'application/xml; charset=utf-8'
      },
      body: `<?xml version="1.0" encoding="utf-8" ?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <c:calendar-data />
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VEVENT" />
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`
    });
    const calendars = extractCalDavCalendarData(responseText);
    return calendars.length > 0 ? calendars : [responseText];
  }

  private async fetchText(
    url: string,
    source: CalendarSource,
    init: RequestInit = {}
  ): Promise<string> {
    const headers = new Headers(init.headers);
    if (source.authType === 'basic') {
      const password = this.secretStore.getSecret(source.passwordSecretId);
      if (!source.username || !password) throw new Error('Missing calendar credentials.');
      headers.set(
        'Authorization',
        `Basic ${Buffer.from(`${source.username}:${password}`).toString('base64')}`
      );
    }
    const response = await fetch(url, {
      ...init,
      headers
    });
    if (!response.ok) throw new Error(`Calendar request failed: ${response.status}`);
    return response.text();
  }
}

const upsertIcsFileEvent = async (
  filePath: string,
  uid: string,
  calendarText: string
): Promise<void> => {
  const eventText = extractSingleEvent(calendarText);
  const currentText = await readCalendarFile(filePath);
  const existingEvent = new RegExp(
    `BEGIN:VEVENT[\\s\\S]*?UID:${escapeRegExp(uid)}\\r?\\n[\\s\\S]*?END:VEVENT\\r?\\n?`,
    'g'
  );
  const withoutExisting = currentText.replace(existingEvent, '');
  const nextText = withoutExisting.includes('END:VCALENDAR')
    ? withoutExisting.replace(/END:VCALENDAR\s*$/m, `${eventText}\r\nEND:VCALENDAR\r\n`)
    : `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//tnet//Tasks//EN\r\n${eventText}\r\nEND:VCALENDAR\r\n`;
  await fs.writeFile(filePath, nextText, 'utf-8');
};

const readCalendarFile = async (filePath: string): Promise<string> => {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//tnet//Tasks//EN\r\nEND:VCALENDAR\r\n';
  }
};

const extractSingleEvent = (calendarText: string): string => {
  const match = /BEGIN:VEVENT[\s\S]*?END:VEVENT/.exec(calendarText);
  if (!match) throw new Error('Calendar text does not contain a VEVENT.');
  return match[0];
};

const resolveCalDavEventUrl = (collectionUrl: string, uid: string): string =>
  `${collectionUrl.replace(/\/?$/, '/')}${encodeURIComponent(uid)}.ics`;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
