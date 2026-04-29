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
});
