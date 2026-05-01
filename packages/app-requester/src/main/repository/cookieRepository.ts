import { randomUUID } from 'node:crypto';
import type { RequesterCookie } from '@tnet/app-requester/shared/requesterTypes';
import type { RequesterCookieStore } from '../service/requestExecutionService';
import type { RequesterDatabase } from './requesterDb';

interface CookieRow {
  id: string;
  workspace_id: string;
  name: string;
  value: string;
  domain: string;
  path: string;
  expires_at: string | null;
  secure: number;
  http_only: number;
  same_site: 'strict' | 'lax' | 'none' | null;
  host_only: number;
  created_at: string;
  updated_at: string;
}

interface ParsedCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expiresAt?: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  hostOnly: boolean;
}

const toCookie = (row: CookieRow): RequesterCookie => ({
  id: row.id,
  workspaceId: row.workspace_id,
  name: row.name,
  value: row.value,
  domain: row.domain,
  path: row.path,
  expiresAt: row.expires_at ?? undefined,
  secure: Boolean(row.secure),
  httpOnly: Boolean(row.http_only),
  sameSite: row.same_site ?? undefined,
  hostOnly: Boolean(row.host_only),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const defaultCookiePath = (url: URL): string => {
  const pathname = url.pathname || '/';
  if (!pathname.includes('/') || pathname === '/') return '/';
  const parent = pathname.slice(0, pathname.lastIndexOf('/'));
  return parent || '/';
};

export const parseSetCookieHeader = (header: string, requestUrl: string): ParsedCookie | null => {
  const url = new URL(requestUrl);
  const parts = header.split(';').map((part) => part.trim());
  const [nameValue, ...attributes] = parts;
  const separatorIndex = nameValue.indexOf('=');
  if (separatorIndex <= 0) return null;

  const parsed: ParsedCookie = {
    name: nameValue.slice(0, separatorIndex),
    value: nameValue.slice(separatorIndex + 1),
    domain: url.hostname.toLowerCase(),
    path: defaultCookiePath(url),
    secure: false,
    httpOnly: false,
    hostOnly: true
  };

  for (const attribute of attributes) {
    const [rawName, ...rawValueParts] = attribute.split('=');
    const attributeName = rawName.trim().toLowerCase();
    const attributeValue = rawValueParts.join('=').trim();

    if (attributeName === 'domain' && attributeValue) {
      parsed.domain = attributeValue.replace(/^\./, '').toLowerCase();
      parsed.hostOnly = false;
    } else if (attributeName === 'path' && attributeValue.startsWith('/')) {
      parsed.path = attributeValue;
    } else if (attributeName === 'expires' && attributeValue) {
      const expires = new Date(attributeValue);
      if (!Number.isNaN(expires.getTime())) parsed.expiresAt = expires.toISOString();
    } else if (attributeName === 'max-age' && attributeValue) {
      const seconds = Number(attributeValue);
      if (Number.isFinite(seconds)) {
        parsed.expiresAt = new Date(Date.now() + seconds * 1000).toISOString();
      }
    } else if (attributeName === 'secure') {
      parsed.secure = true;
    } else if (attributeName === 'httponly') {
      parsed.httpOnly = true;
    } else if (attributeName === 'samesite') {
      const sameSite = attributeValue.toLowerCase();
      if (sameSite === 'strict' || sameSite === 'lax' || sameSite === 'none') {
        parsed.sameSite = sameSite;
      }
    }
  }

  return parsed;
};

const getSetCookieHeaders = (headers: Headers): string[] => {
  const withGetSetCookie = headers as Headers & { getSetCookie?: () => string[] };
  const setCookieHeaders = withGetSetCookie.getSetCookie?.();
  if (setCookieHeaders && setCookieHeaders.length > 0) return setCookieHeaders;

  const setCookie = headers.get('set-cookie');
  return setCookie ? [setCookie] : [];
};

const domainMatches = (cookie: RequesterCookie, hostname: string): boolean => {
  if (cookie.hostOnly) return cookie.domain === hostname;
  return cookie.domain === hostname || hostname.endsWith(`.${cookie.domain}`);
};

const pathMatches = (cookiePath: string, requestPath: string): boolean =>
  requestPath === cookiePath ||
  requestPath.startsWith(cookiePath.endsWith('/') ? cookiePath : `${cookiePath}/`);

export class CookieRepository implements RequesterCookieStore {
  constructor(private readonly database: RequesterDatabase) {}

  list(workspaceId: string): RequesterCookie[] {
    const rows = this.database
      .prepare(
        `SELECT id, workspace_id, name, value, domain, path, expires_at, secure, http_only,
                same_site, host_only, created_at, updated_at
         FROM cookies
         WHERE workspace_id = ?
         ORDER BY domain ASC, path ASC, name ASC`
      )
      .all(workspaceId) as CookieRow[];
    return rows.map(toCookie);
  }

  getCookieHeader(workspaceId: string, requestUrl: string): string | undefined {
    this.deleteExpired(workspaceId);
    const url = new URL(requestUrl);
    const now = new Date().toISOString();
    const cookies = this.list(workspaceId)
      .filter((cookie) => !cookie.expiresAt || cookie.expiresAt > now)
      .filter((cookie) => !cookie.secure || url.protocol === 'https:')
      .filter((cookie) => domainMatches(cookie, url.hostname.toLowerCase()))
      .filter((cookie) => pathMatches(cookie.path, url.pathname || '/'))
      .sort((left, right) => right.path.length - left.path.length);

    if (cookies.length === 0) return undefined;
    return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
  }

  saveFromResponse(workspaceId: string, requestUrl: string, headers: Headers): void {
    for (const header of getSetCookieHeaders(headers)) {
      const cookie = parseSetCookieHeader(header, requestUrl);
      if (!cookie) continue;
      this.save(workspaceId, cookie);
    }
  }

  remove(cookieId: string): void {
    this.database.prepare('DELETE FROM cookies WHERE id = ?').run(cookieId);
  }

  clear(workspaceId: string): void {
    this.database.prepare('DELETE FROM cookies WHERE workspace_id = ?').run(workspaceId);
  }

  deleteExpired(workspaceId: string): void {
    this.database
      .prepare(
        'DELETE FROM cookies WHERE workspace_id = ? AND expires_at IS NOT NULL AND expires_at <= ?'
      )
      .run(workspaceId, new Date().toISOString());
  }

  private save(workspaceId: string, cookie: ParsedCookie): void {
    const now = new Date().toISOString();
    this.database
      .prepare(
        `INSERT INTO cookies (
           id, workspace_id, name, value, domain, path, expires_at, secure, http_only,
           same_site, host_only, created_at, updated_at
         ) VALUES (
           @id, @workspaceId, @name, @value, @domain, @path, @expiresAt, @secure,
           @httpOnly, @sameSite, @hostOnly, @createdAt, @updatedAt
         )
         ON CONFLICT(workspace_id, name, domain, path) DO UPDATE SET
           value = excluded.value,
           expires_at = excluded.expires_at,
           secure = excluded.secure,
           http_only = excluded.http_only,
           same_site = excluded.same_site,
           host_only = excluded.host_only,
           updated_at = excluded.updated_at`
      )
      .run({
        id: randomUUID(),
        workspaceId,
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        expiresAt: cookie.expiresAt ?? null,
        secure: cookie.secure ? 1 : 0,
        httpOnly: cookie.httpOnly ? 1 : 0,
        sameSite: cookie.sameSite ?? null,
        hostOnly: cookie.hostOnly ? 1 : 0,
        createdAt: now,
        updatedAt: now
      });
  }
}
