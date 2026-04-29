// @vitest-environment node
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { openPapersDatabase, type PapersDatabase } from './papersDatabase';
import { PapersRepository } from './papersRepository';

const tempDir = async (): Promise<string> =>
  fs.mkdtemp(path.join(os.tmpdir(), 'tnet-papers-repository-'));

describe('PapersRepository', () => {
  let database: PapersDatabase | null = null;

  afterEach(() => {
    database?.close();
    database = null;
  });

  it('creates and reads paper metadata, authors, and notes', async () => {
    database = await openPapersDatabase(await tempDir());
    const repository = new PapersRepository(database);

    const paper = repository.createPaper({
      title: 'A Typed Approach to Local Paper Libraries',
      authors: ['Ada Lovelace', 'Alan Turing'],
      abstract: 'Local-first paper management.',
      publishedYear: 2026,
      venue: 'TNET Symposium',
      doi: '10.0000/tnet.1',
      pdfPath: 'papers/typed-local-paper-libraries.pdf',
      directoryPath: 'logic',
      noteContent: '# Reading note'
    });

    expect(paper).toMatchObject({
      title: 'A Typed Approach to Local Paper Libraries',
      authors: ['Ada Lovelace', 'Alan Turing'],
      publishedYear: 2026,
      venue: 'TNET Symposium',
      tags: [],
      hasPdf: true,
      directoryPath: 'logic',
      noteContent: '# Reading note'
    });
    expect(repository.getPaper(paper.id)).toMatchObject({
      title: paper.title,
      doi: '10.0000/tnet.1',
      pdfPath: 'papers/typed-local-paper-libraries.pdf'
    });
    expect(repository.listPapers('logic')).toHaveLength(1);
    expect(repository.listPapers('algebra')).toHaveLength(0);
  });

  it('filters root directory papers when directoryPath is an empty string', async () => {
    database = await openPapersDatabase(await tempDir());
    const repository = new PapersRepository(database);

    repository.createPaper({
      title: 'Root paper',
      pdfPath: 'root.pdf',
      directoryPath: ''
    });
    repository.createPaper({
      title: 'Nested paper',
      pdfPath: 'logic/nested.pdf',
      directoryPath: 'logic'
    });

    expect(repository.listPapers('').map((paper) => paper.title)).toEqual(['Root paper']);
    expect(
      repository
        .listPapers()
        .map((paper) => paper.title)
        .sort()
    ).toEqual(['Nested paper', 'Root paper']);
  });

  it('creates tags, attaches them to papers, and filters by tag and search query', async () => {
    database = await openPapersDatabase(await tempDir());
    const repository = new PapersRepository(database);

    const logicPaper = repository.createPaper({
      title: 'Lambda Calculus Foundations',
      authors: ['Alonzo Church'],
      abstract: 'Functions and logic.',
      pdfPath: 'logic/lambda.pdf',
      directoryPath: 'logic'
    });
    repository.createPaper({
      title: 'Geometry Notes',
      authors: ['Emmy Noether'],
      abstract: 'Curves and surfaces.',
      pdfPath: 'geometry/notes.pdf',
      directoryPath: 'geometry'
    });

    const tag = repository.upsertTag('logic');
    expect(repository.listTags()).toEqual([tag]);

    expect(repository.attachTag(logicPaper.id, tag.id)).toMatchObject({
      id: logicPaper.id,
      tags: ['logic']
    });
    expect(
      repository.listPapers({ directoryPath: 'logic', query: 'Lambda', tagIds: [tag.id] })
    ).toMatchObject([{ title: 'Lambda Calculus Foundations', tags: ['logic'] }]);
    expect(repository.listPapers({ query: 'surfaces', tagIds: [tag.id] })).toEqual([]);

    expect(repository.detachTag(logicPaper.id, tag.id)).toMatchObject({
      id: logicPaper.id,
      tags: []
    });
    expect(repository.listPapers({ tagIds: [tag.id] })).toEqual([]);
  });

  it('saves notes and updates the full-text search index', async () => {
    database = await openPapersDatabase(await tempDir());
    const repository = new PapersRepository(database);

    const paper = repository.createPaper({
      title: 'Modal Logic',
      pdfPath: 'logic/modal.pdf'
    });

    expect(repository.listPapers({ query: 'Kripke' })).toEqual([]);

    expect(repository.saveNote(paper.id, '# Reading note\nKripke semantics')).toMatchObject({
      id: paper.id,
      noteContent: '# Reading note\nKripke semantics'
    });
    expect(repository.listPapers({ query: 'Kripke' })).toMatchObject([{ id: paper.id }]);
  });
});
