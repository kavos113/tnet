import { randomUUID } from 'crypto';
import type { PaperDetail, PaperSummary } from '@tnet/app-papers/shared/paperTypes';
import type { PapersDatabase } from './papersDatabase';

export interface CreatePaperInput {
  title: string;
  authors?: string[];
  abstract?: string;
  publishedYear?: number;
  venue?: string;
  doi?: string;
  arxivId?: string;
  url?: string;
  pdfPath?: string;
  directoryPath?: string;
  noteContent?: string;
}

interface PaperRow {
  id: string;
  title: string;
  abstract: string | null;
  published_year: number | null;
  venue: string | null;
  doi: string | null;
  arxiv_id: string | null;
  url: string | null;
  pdf_path: string | null;
  directory_path: string;
}

const nowIso = (): string => new Date().toISOString();

const listAuthors = (database: PapersDatabase, paperId: string): string[] =>
  database
    .prepare('SELECT name FROM paper_authors WHERE paper_id = ? ORDER BY position ASC')
    .all(paperId)
    .map((row) => (row as { name: string }).name);

const listTags = (database: PapersDatabase, paperId: string): string[] =>
  database
    .prepare(
      `
      SELECT tags.name
      FROM tags
      JOIN paper_tags ON paper_tags.tag_id = tags.id
      WHERE paper_tags.paper_id = ?
      ORDER BY tags.name ASC
    `
    )
    .all(paperId)
    .map((row) => (row as { name: string }).name);

const toSummary = (database: PapersDatabase, row: PaperRow): PaperSummary => ({
  id: row.id,
  title: row.title,
  authors: listAuthors(database, row.id),
  publishedYear: row.published_year ?? undefined,
  venue: row.venue ?? undefined,
  tags: listTags(database, row.id),
  hasPdf: Boolean(row.pdf_path)
});

const toDetail = (database: PapersDatabase, row: PaperRow): PaperDetail => {
  const note = database.prepare('SELECT content FROM notes WHERE paper_id = ?').get(row.id) as
    | { content: string }
    | undefined;

  return {
    ...toSummary(database, row),
    abstract: row.abstract ?? undefined,
    doi: row.doi ?? undefined,
    arxivId: row.arxiv_id ?? undefined,
    url: row.url ?? undefined,
    pdfPath: row.pdf_path ?? undefined,
    directoryPath: row.directory_path,
    noteContent: note?.content ?? ''
  };
};

const refreshSearchIndex = (database: PapersDatabase, paperId: string): void => {
  const paper = database.prepare('SELECT * FROM papers WHERE id = ?').get(paperId) as
    | PaperRow
    | undefined;
  if (!paper) return;

  const authors = listAuthors(database, paperId).join(', ');
  const note = database.prepare('SELECT content FROM notes WHERE paper_id = ?').get(paperId) as
    | { content: string }
    | undefined;

  database.prepare('DELETE FROM paper_search WHERE paper_id = ?').run(paperId);
  database
    .prepare(
      `
      INSERT INTO paper_search (paper_id, title, authors, abstract, note)
      VALUES (?, ?, ?, ?, ?)
    `
    )
    .run(paperId, paper.title, authors, paper.abstract ?? '', note?.content ?? '');
};

export class PapersRepository {
  constructor(private readonly database: PapersDatabase) {}

  createPaper(input: CreatePaperInput): PaperDetail {
    const title = input.title.trim();
    if (!title) throw new Error('title is required');
    if (input.pdfPath) {
      const existing = this.getPaperByPdfPath(input.pdfPath);
      if (existing) return existing;
    }

    const id = randomUUID();
    const createdAt = nowIso();
    const authors = input.authors ?? [];
    const noteContent = input.noteContent ?? '';

    const createPaper = this.database.transaction(() => {
      this.database
        .prepare(
          `
          INSERT INTO papers (
            id,
            title,
            abstract,
            published_year,
            venue,
            doi,
            arxiv_id,
            url,
            pdf_path,
            directory_path,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        )
        .run(
          id,
          title,
          input.abstract ?? null,
          input.publishedYear ?? null,
          input.venue ?? null,
          input.doi ?? null,
          input.arxivId ?? null,
          input.url ?? null,
          input.pdfPath ?? null,
          input.directoryPath ?? '',
          createdAt,
          createdAt
        );

      const insertAuthor = this.database.prepare(
        'INSERT INTO paper_authors (id, paper_id, name, position) VALUES (?, ?, ?, ?)'
      );
      authors.forEach((name, index) => {
        insertAuthor.run(randomUUID(), id, name, index);
      });

      this.database
        .prepare('INSERT INTO notes (paper_id, content, updated_at) VALUES (?, ?, ?)')
        .run(id, noteContent, createdAt);

      refreshSearchIndex(this.database, id);
    });

    createPaper();
    const created = this.getPaper(id);
    if (!created) throw new Error('failed to create paper');
    return created;
  }

  listPapers(directoryPath?: string): PaperSummary[] {
    const rows =
      directoryPath !== undefined
        ? this.database
            .prepare('SELECT * FROM papers WHERE directory_path = ? ORDER BY updated_at DESC')
            .all(directoryPath)
        : this.database.prepare('SELECT * FROM papers ORDER BY updated_at DESC').all();

    return (rows as PaperRow[]).map((row) => toSummary(this.database, row));
  }

  getPaper(id: string): PaperDetail | null {
    const row = this.database.prepare('SELECT * FROM papers WHERE id = ?').get(id) as
      | PaperRow
      | undefined;
    return row ? toDetail(this.database, row) : null;
  }

  getPaperByPdfPath(pdfPath: string): PaperDetail | null {
    const row = this.database.prepare('SELECT * FROM papers WHERE pdf_path = ?').get(pdfPath) as
      | PaperRow
      | undefined;
    return row ? toDetail(this.database, row) : null;
  }
}
