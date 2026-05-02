import { randomUUID } from 'node:crypto';
import type {
  CreateRssFolderInput,
  MoveRssFolderInput,
  RenameRssFolderInput,
  RssFolder
} from '@tnet/app-rss/shared/rssTypes';
import type { RssDatabase } from './rssDb';

interface FolderRow {
  id: string;
  parent_id: string | null;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const toFolder = (row: FolderRow): RssFolder => ({
  id: row.id,
  parentId: row.parent_id ?? undefined,
  name: row.name,
  sortOrder: row.sort_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export class RssFolderRepository {
  constructor(private readonly database: RssDatabase) {}

  list(): RssFolder[] {
    const rows = this.database
      .prepare(
        `SELECT id, parent_id, name, sort_order, created_at, updated_at
         FROM rss_folders
         ORDER BY parent_id IS NOT NULL, sort_order ASC, lower(name) ASC`
      )
      .all() as FolderRow[];
    return rows.map(toFolder);
  }

  get(folderId: string): RssFolder | null {
    const row = this.database
      .prepare(
        `SELECT id, parent_id, name, sort_order, created_at, updated_at
         FROM rss_folders
         WHERE id = ?`
      )
      .get(folderId) as FolderRow | undefined;
    return row ? toFolder(row) : null;
  }

  create(input: CreateRssFolderInput): RssFolder {
    const now = new Date().toISOString();
    const folderId = randomUUID();
    const name = normalizeName(input.name);
    this.database
      .prepare(
        `INSERT INTO rss_folders (id, parent_id, name, sort_order, created_at, updated_at)
         VALUES (@id, @parentId, @name, @sortOrder, @createdAt, @updatedAt)`
      )
      .run({
        id: folderId,
        parentId: input.parentId ?? null,
        name,
        sortOrder: this.nextSortOrder(input.parentId),
        createdAt: now,
        updatedAt: now
      });
    return this.require(folderId);
  }

  rename(input: RenameRssFolderInput): RssFolder {
    const folder = this.require(input.folderId);
    this.database
      .prepare('UPDATE rss_folders SET name = ?, updated_at = ? WHERE id = ?')
      .run(normalizeName(input.name), new Date().toISOString(), folder.id);
    return this.require(folder.id);
  }

  move(input: MoveRssFolderInput): RssFolder {
    const folder = this.require(input.folderId);
    if (input.parentId === folder.id) throw new Error('Folder cannot be moved into itself.');
    if (input.parentId && this.isDescendant(input.parentId, folder.id)) {
      throw new Error('Folder cannot be moved into a descendant.');
    }
    this.database
      .prepare('UPDATE rss_folders SET parent_id = ?, sort_order = ?, updated_at = ? WHERE id = ?')
      .run(
        input.parentId ?? null,
        this.nextSortOrder(input.parentId),
        new Date().toISOString(),
        folder.id
      );
    return this.require(folder.id);
  }

  remove(folderId: string): void {
    this.database.prepare('DELETE FROM rss_folders WHERE id = ?').run(folderId);
  }

  private require(folderId: string): RssFolder {
    const folder = this.get(folderId);
    if (!folder) throw new Error(`RSS folder not found: ${folderId}`);
    return folder;
  }

  private nextSortOrder(parentId: string | undefined): number {
    const row = this.database
      .prepare(
        'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM rss_folders WHERE parent_id IS ?'
      )
      .get(parentId ?? null) as { next_order: number };
    return row.next_order;
  }

  private isDescendant(folderId: string, ancestorId: string): boolean {
    let current = this.get(folderId);
    while (current?.parentId) {
      if (current.parentId === ancestorId) return true;
      current = this.get(current.parentId);
    }
    return false;
  }
}

const normalizeName = (name: string): string => {
  const normalized = name.trim();
  if (!normalized) throw new Error('Folder name is required.');
  return normalized;
};
