import { describe, expect, it, vi } from 'vitest';
import { markdownToHtml } from './markdownToHtml';
import { renderMermaid } from './renderMermaid';

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    run: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('markdown preview pipeline', () => {
  it('converts common Markdown features to HTML', async () => {
    const html = await markdownToHtml('# Hello\n\n| A | B |\n| - | - |\n| 1 | 2 |');

    expect(html).toContain('<h1');
    expect(html).toContain('Hello');
    expect(html).toContain('<table');
  });

  it('converts internal links to clickable preview links', async () => {
    const html = await markdownToHtml('See [[/docs/file.md|File Name]].');

    expect(html).toContain('data-internal-link="true"');
    expect(html).toContain('data-path="/docs/file.md"');
    expect(html).toContain('File Name');
  });

  it('converts mermaid and cardlink code blocks', async () => {
    const html = await markdownToHtml(
      [
        '```mermaid',
        'graph TD;',
        'A-->B;',
        '```',
        '',
        '```cardlink',
        'url: https://example.com',
        'title: Example',
        'host: example.com',
        '```'
      ].join('\n')
    );

    expect(html).toContain('class="mermaid"');
    expect(html).toContain('card-link-container');
    expect(html).toContain('href="https://example.com"');
  });

  it('renders keyword tags as styled preview sections', async () => {
    const html = await markdownToHtml('<keyword name="Definition" type="e">**Body**</keyword>');

    expect(html).toContain('keyword-emphasized');
    expect(html).toContain('Definition');
    expect(html).toContain('<strong>Body</strong>');
  });

  it('marks block elements with source lines for scroll sync', async () => {
    const html = await markdownToHtml(
      ['# Title', '', 'Paragraph', '', '<keyword name="Definition">Body</keyword>'].join('\n')
    );

    expect(html).toContain('data-source-line="1"');
    expect(html).toContain('data-source-line="3"');
    expect(html).toContain('data-source-line="5"');
  });

  it('converts Obsidian image links without local file URLs', async () => {
    const html = await markdownToHtml('![[image.png]]');

    expect(html).toContain('/_images/image.png');
    expect(html).not.toContain('file://');
  });

  it('converts Obsidian image links to resolved data URLs', async () => {
    const html = await markdownToHtml('![[image.png]]', {
      resolveImageSrc: async (filename) =>
        filename === 'image.png' ? 'data:image/png;base64,aW1hZ2U=' : null
    });

    expect(html).toContain('src="data:image/png;base64,aW1hZ2U="');
  });

  it('runs Mermaid rendering for existing diagram nodes', async () => {
    document.body.innerHTML = '<div class="mermaid">graph TD; A-->B;</div>';
    const mermaid = await import('mermaid');

    await renderMermaid(document);

    expect(mermaid.default.initialize).toHaveBeenCalledWith({ startOnLoad: false });
    expect(mermaid.default.run).toHaveBeenCalled();
  });
});
