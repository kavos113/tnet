// @vitest-environment node
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CalendarSourceRepository } from './repository/calendarSourceRepository';
import { openTasksDatabase } from './repository/tasksDb';
import { createTasksSecretStore } from './tasksSecretStore';
import { GoogleCalendarService } from './googleCalendarService';

const generateAuthUrl = vi.hoisted(() => vi.fn(() => 'https://accounts.google.test/auth'));
const getToken = vi.hoisted(() =>
  vi.fn(async () => ({
    tokens: {
      refresh_token: 'refresh-token',
      access_token: 'access-token'
    }
  }))
);
const setCredentials = vi.hoisted(() => vi.fn());
const eventsList = vi.hoisted(() =>
  vi.fn(async () => ({
    data: {
      items: [
        {
          id: 'event-1',
          iCalUID: 'uid-1',
          summary: 'Planning',
          start: { dateTime: '2026-05-02T10:00:00Z' },
          end: { dateTime: '2026-05-02T11:00:00Z' }
        }
      ]
    }
  }))
);

vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: vi.fn(function OAuth2() {
        return {
          generateAuthUrl,
          getToken,
          setCredentials
        };
      })
    },
    calendar: vi.fn(() => ({
      events: {
        list: eventsList
      }
    }))
  }
}));

const tempDir = async (name: string): Promise<string> =>
  fs.mkdtemp(path.join(os.tmpdir(), `tnet-google-calendar-${name}-`));

const writeCredentials = async (dir: string): Promise<string> => {
  const credentialsPath = path.join(dir, 'credentials.json');
  await fs.writeFile(
    credentialsPath,
    JSON.stringify({
      installed: {
        client_id: 'client-id',
        client_secret: 'client-secret',
        redirect_uris: ['http://localhost']
      }
    }),
    'utf-8'
  );
  return credentialsPath;
};

describe('GoogleCalendarService', () => {
  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.TNET_GOOGLE_CALENDAR_CREDENTIALS_PATH;
  });

  it('creates auth URLs and stores OAuth tokens in the tasks secret store', async () => {
    const userDataDir = await tempDir('auth');
    process.env.TNET_GOOGLE_CALENDAR_CREDENTIALS_PATH = await writeCredentials(userDataDir);
    const database = openTasksDatabase(userDataDir);
    const sourceRepository = new CalendarSourceRepository(database);
    const secretStore = createTasksSecretStore(userDataDir);
    const source = sourceRepository.save({
      name: 'Google',
      type: 'google-calendar',
      uri: 'primary'
    });
    const service = new GoogleCalendarService(sourceRepository, secretStore);

    expect(service.createAuthUrl(source.id)).toBe('https://accounts.google.test/auth');
    const authorized = await service.completeAuth(source.id, 'auth-code');

    expect(getToken).toHaveBeenCalledWith('auth-code');
    expect(authorized.googleTokenSecretId).toBeTruthy();
    expect(secretStore.getSecret(authorized.googleTokenSecretId)).toContain('refresh-token');
    database.close();
  });

  it('lists Google Calendar events with the expected query shape', async () => {
    const userDataDir = await tempDir('events');
    process.env.TNET_GOOGLE_CALENDAR_CREDENTIALS_PATH = await writeCredentials(userDataDir);
    const database = openTasksDatabase(userDataDir);
    const sourceRepository = new CalendarSourceRepository(database);
    const secretStore = createTasksSecretStore(userDataDir);
    const tokenSecretId = secretStore.saveSecret(
      JSON.stringify({ refresh_token: 'refresh-token' })
    );
    const source = sourceRepository.save({
      name: 'Google',
      type: 'google-calendar',
      uri: 'primary',
      googleTokenSecretId: tokenSecretId
    });
    const service = new GoogleCalendarService(sourceRepository, secretStore);

    await expect(
      service.listEvents({
        source,
        timeMin: '2026-05-01T00:00:00.000Z',
        timeMax: '2026-05-31T23:59:59.999Z'
      })
    ).resolves.toEqual([expect.objectContaining({ summary: 'Planning' })]);

    expect(setCredentials).toHaveBeenCalledWith({ refresh_token: 'refresh-token' });
    expect(eventsList).toHaveBeenCalledWith({
      calendarId: 'primary',
      timeMin: '2026-05-01T00:00:00.000Z',
      timeMax: '2026-05-31T23:59:59.999Z',
      singleEvents: true,
      orderBy: 'startTime'
    });
    database.close();
  });
});
