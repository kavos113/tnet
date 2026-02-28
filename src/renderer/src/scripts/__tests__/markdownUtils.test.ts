import { describe, it, expect, vi, beforeEach } from 'vitest';
import { markdownToHtml, setProjectRoot, getProjectRoot, renderMermaid } from '../markdownUtils';

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    run: vi.fn()
  }
}));

describe('markdownUtils', () => {
  beforeEach(() => {
    setProjectRoot('');
  });

  describe('setProjectRoot / getProjectRoot', () => {
    it('projectRootを設定・取得できる', () => {
      setProjectRoot('/workspace/root');
      expect(getProjectRoot()).toBe('/workspace/root');
    });

    it('Windowsパスのバックスラッシュがスラッシュに変換される', () => {
      setProjectRoot('C:\\Users\\test\\workspace');
      expect(getProjectRoot()).toBe('C:/Users/test/workspace');
    });

    it('空文字列を設定しようとするとwarningが出る', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      setProjectRoot('');
      expect(spy).toHaveBeenCalledWith('Project root is not set. Using default empty string.');
      spy.mockRestore();
    });
  });

  describe('markdownToHtml', () => {
    it('基本的なMarkdownをHTMLに変換する', async () => {
      const html = await markdownToHtml('# Hello');
      expect(html).toContain('<h1');
      expect(html).toContain('Hello');
    });

    it('段落をHTMLに変換する', async () => {
      const html = await markdownToHtml('This is a paragraph.');
      expect(html).toContain('<p>');
      expect(html).toContain('This is a paragraph.');
    });

    it('GFMテーブルをHTMLに変換する', async () => {
      const md = `| Header1 | Header2 |
| --- | --- |
| Cell1 | Cell2 |`;
      const html = await markdownToHtml(md);
      expect(html).toContain('<table>');
      expect(html).toContain('<th>Header1</th>');
      expect(html).toContain('<td>Cell1</td>');
    });

    it('GFMタスクリストをHTMLに変換する', async () => {
      const md = `- [x] Done
- [ ] Todo`;
      const html = await markdownToHtml(md);
      expect(html).toContain('type="checkbox"');
    });

    it('コードブロックをハイライト付きでHTMLに変換する', async () => {
      const md = '```js\nconst x = 1;\n```';
      const html = await markdownToHtml(md);
      expect(html).toContain('<code');
      expect(html).toContain('hljs');
    });

    it('数式（KaTeX）をHTMLに変換する', async () => {
      const md = '$E = mc^2$';
      const html = await markdownToHtml(md);
      expect(html).toContain('katex');
    });

    it('内部リンク [[path|name]] をHTMLに変換する', async () => {
      const md = 'See [[/docs/file.md|File Name]] for details.';
      const html = await markdownToHtml(md);
      expect(html).toContain('data-internal-link="true"');
      expect(html).toContain('data-path="/docs/file.md"');
      expect(html).toContain('File Name');
    });

    it('内部リンク [[path]] をパス名で表示する', async () => {
      const md = 'See [[/docs/file.md]] for details.';
      const html = await markdownToHtml(md);
      expect(html).toContain('data-internal-link="true"');
      expect(html).toContain('/docs/file.md');
    });

    it('mermaidコードブロックをdiv.mermaidに変換する', async () => {
      const md = '```mermaid\ngraph TD;\nA-->B;\n```';
      const html = await markdownToHtml(md);
      expect(html).toContain('class="mermaid"');
      expect(html).toContain('graph TD;');
    });

    it('cardlinkコードブロックをカードリンクに変換する', async () => {
      const md = `\`\`\`cardlink
url: https://example.com
title: Example
description: An example site
host: example.com
\`\`\``;
      const html = await markdownToHtml(md);
      expect(html).toContain('card-link-container');
      expect(html).toContain('href="https://example.com"');
      expect(html).toContain('Example');
    });

    it('Obsidian形式の画像リンク ![[filename]] をimg要素に変換する', async () => {
      setProjectRoot('/workspace');
      const md = '![[image.png]]';
      const html = await markdownToHtml(md);
      expect(html).toContain('<img');
      expect(html).toContain('image.png');
      expect(html).toContain('/_images/');
    });

    it('keywordタグをスタイル付きのdivに変換する', async () => {
      const md = '<keyword name="Test Keyword">This is the keyword content.</keyword>';
      const html = await markdownToHtml(md);
      expect(html).toContain('class="keyword"');
      expect(html).toContain('Test Keyword');
    });

    it('見出しにIDが付与される（rehype-slug）', async () => {
      const md = '## Hello World';
      const html = await markdownToHtml(md);
      expect(html).toContain('id="hello-world"');
    });

    it('改行がbrタグに変換される（remark-breaks）', async () => {
      const md = 'line1\nline2';
      const html = await markdownToHtml(md);
      expect(html).toContain('<br');
    });
  });

  describe('renderMermaid', () => {
    it('mermaid.initializeとmermaid.runを呼ぶ', async () => {
      const mermaid = await import('mermaid');
      renderMermaid();
      expect(mermaid.default.initialize).toHaveBeenCalledWith({ startOnLoad: false });
      expect(mermaid.default.run).toHaveBeenCalled();
    });
  });
});
