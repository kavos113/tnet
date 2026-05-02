import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchRemoteFeedTitle, readLocalFeedTitle } from './feedTitleService';

describe('feedTitleService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches and parses a remote feed title', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          `<feed xmlns="http://www.w3.org/2005/Atom">
            <title>Remote Atom Title</title>
          </feed>`,
          { status: 200 }
        )
      )
    );

    await expect(
      fetchRemoteFeedTitle('https://example.com/atom.xml', { timeoutSeconds: 3 })
    ).resolves.toBe('Remote Atom Title');
  });

  it('reads and parses a local feed title', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tnet-rss-title-test-'));
    const filePath = path.join(tempDir, 'feed.xml');
    try {
      await fs.writeFile(
        filePath,
        `<rss version="2.0"><channel><title>Local RSS Title</title></channel></rss>`,
        'utf8'
      );

      await expect(readLocalFeedTitle(filePath)).resolves.toBe('Local RSS Title');
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});
