import { randomUUID } from 'node:crypto';
import type {
  CalendarSource,
  CalendarSourceItemKind,
  CalendarSourcePurpose,
  CalendarSourceType,
  SaveCalendarSourceInput
} from '@tnet/app-tasks/shared/tasksTypes';
import type { TasksDatabase } from './tasksDb';

interface CalendarSourceRow {
  id: string;
  name: string;
  type: CalendarSourceType;
  item_kind: CalendarSourceItemKind;
  purpose: CalendarSourcePurpose;
  uri: string;
  color: string | null;
  enabled: number;
  write_back_enabled: number;
  auth_type: 'none' | 'basic';
  username: string | null;
  password_secret_id: string | null;
  google_token_secret_id: string | null;
  last_synced_at: string | null;
  last_sync_error: string | null;
  created_at: string;
  updated_at: string;
}

const toCalendarSource = (row: CalendarSourceRow): CalendarSource => ({
  id: row.id,
  name: row.name,
  type: row.type,
  itemKind: row.item_kind,
  purpose: row.purpose,
  uri: row.uri,
  color: row.color ?? undefined,
  enabled: row.enabled === 1,
  writeBackEnabled: row.write_back_enabled === 1,
  authType: row.auth_type,
  username: row.username ?? undefined,
  passwordSecretId: row.password_secret_id ?? undefined,
  googleTokenSecretId: row.google_token_secret_id ?? undefined,
  lastSyncedAt: row.last_synced_at ?? undefined,
  lastSyncError: row.last_sync_error ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export class CalendarSourceRepository {
  constructor(private readonly database: TasksDatabase) {}

  list(): CalendarSource[] {
    const rows = this.database
      .prepare(
        `SELECT id, name, type, item_kind, purpose, uri, color, enabled, write_back_enabled,
                auth_type, username, password_secret_id, google_token_secret_id, last_synced_at,
                last_sync_error, created_at, updated_at
         FROM calendar_sources
         ORDER BY lower(name) ASC`
      )
      .all() as CalendarSourceRow[];
    return rows.map(toCalendarSource);
  }

  get(sourceId: string): CalendarSource | null {
    const row = this.database
      .prepare(
        `SELECT id, name, type, item_kind, purpose, uri, color, enabled, write_back_enabled,
                auth_type, username, password_secret_id, google_token_secret_id, last_synced_at,
                last_sync_error, created_at, updated_at
         FROM calendar_sources
         WHERE id = ?`
      )
      .get(sourceId) as CalendarSourceRow | undefined;
    return row ? toCalendarSource(row) : null;
  }

  save(input: SaveCalendarSourceInput): CalendarSource {
    const now = new Date().toISOString();
    const existing = input.id ? this.get(input.id) : null;
    const sourceId = input.id ?? randomUUID();
    const name = input.name.trim() || 'Calendar';
    const uri = input.uri.trim();
    const color = input.color?.trim() || undefined;
    const enabled = input.enabled ?? true;
    const itemKind = input.itemKind === 'task' ? 'task' : 'event';
    const purpose = input.purpose === 'holiday' ? 'holiday' : 'calendar';
    const writeBackEnabled = input.writeBackEnabled === true;
    const authType = input.authType === 'basic' ? 'basic' : 'none';
    const username = authType === 'basic' ? input.username?.trim() || undefined : undefined;
    const passwordSecretId =
      authType === 'basic' ? input.passwordSecretId || existing?.passwordSecretId : undefined;
    const googleTokenSecretId = input.googleTokenSecretId || existing?.googleTokenSecretId;

    if (existing) {
      this.database
        .prepare(
          `UPDATE calendar_sources
           SET name = @name,
               type = @type,
               item_kind = @itemKind,
               purpose = @purpose,
               uri = @uri,
               color = @color,
               enabled = @enabled,
               write_back_enabled = @writeBackEnabled,
               auth_type = @authType,
               username = @username,
               password_secret_id = @passwordSecretId,
               google_token_secret_id = @googleTokenSecretId,
               updated_at = @updatedAt
           WHERE id = @id`
        )
        .run({
          id: sourceId,
          name,
          type: input.type,
          itemKind,
          purpose,
          uri,
          color: color ?? null,
          enabled: enabled ? 1 : 0,
          writeBackEnabled: writeBackEnabled ? 1 : 0,
          authType,
          username: username ?? null,
          passwordSecretId: passwordSecretId ?? null,
          googleTokenSecretId: googleTokenSecretId ?? null,
          updatedAt: now
        });
    } else {
      this.database
        .prepare(
          `INSERT INTO calendar_sources (
             id, name, type, item_kind, purpose, uri, color, enabled, write_back_enabled,
             auth_type, username, password_secret_id, google_token_secret_id,
             created_at, updated_at
           )
           VALUES (
             @id, @name, @type, @itemKind, @purpose, @uri, @color, @enabled, @writeBackEnabled,
             @authType, @username, @passwordSecretId, @googleTokenSecretId,
             @createdAt, @updatedAt
           )`
        )
        .run({
          id: sourceId,
          name,
          type: input.type,
          itemKind,
          purpose,
          uri,
          color: color ?? null,
          enabled: enabled ? 1 : 0,
          writeBackEnabled: writeBackEnabled ? 1 : 0,
          authType,
          username: username ?? null,
          passwordSecretId: passwordSecretId ?? null,
          googleTokenSecretId: googleTokenSecretId ?? null,
          createdAt: now,
          updatedAt: now
        });
    }

    const saved = this.get(sourceId);
    if (!saved) throw new Error(`Calendar source not found after save: ${sourceId}`);
    return saved;
  }

  remove(sourceId: string): void {
    this.database.prepare('DELETE FROM calendar_sources WHERE id = ?').run(sourceId);
  }

  saveSyncResult(sourceId: string, error?: string): CalendarSource {
    const now = new Date().toISOString();
    this.database
      .prepare(
        `UPDATE calendar_sources
         SET last_synced_at = @lastSyncedAt,
             last_sync_error = @lastSyncError,
             updated_at = @updatedAt
         WHERE id = @id`
      )
      .run({
        id: sourceId,
        lastSyncedAt: now,
        lastSyncError: error ?? null,
        updatedAt: now
      });
    const source = this.get(sourceId);
    if (!source) throw new Error(`Calendar source not found: ${sourceId}`);
    return source;
  }

  clearSyncError(sourceId: string): CalendarSource {
    const now = new Date().toISOString();
    this.database
      .prepare(
        `UPDATE calendar_sources
         SET last_sync_error = NULL,
             updated_at = @updatedAt
         WHERE id = @id`
      )
      .run({
        id: sourceId,
        updatedAt: now
      });
    const source = this.get(sourceId);
    if (!source) throw new Error(`Calendar source not found: ${sourceId}`);
    return source;
  }
}
