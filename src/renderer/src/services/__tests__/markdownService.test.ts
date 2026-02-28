import { describe, it, expect, vi } from 'vitest';
import { markdownService } from '../markdownService';

vi.mock('@renderer/scripts/markdownUtils', () => ({
  markdownToHtml: vi.fn().mockResolvedValue('<p>mocked html</p>'),
  renderMermaid: vi.fn()
}));

describe('markdownService', () => {
  describe('parse', () => {
    it('markdownToHtmlを呼んでHTMLを返す', async () => {
      const result = await markdownService.parse('# Hello');
      expect(result).toBe('<p>mocked html</p>');
    });
  });

  describe('renderMermaidDiagrams', () => {
    it('renderMermaidを呼ぶ', async () => {
      const { renderMermaid } = await import('@renderer/scripts/markdownUtils');
      markdownService.renderMermaidDiagrams();
      expect(renderMermaid).toHaveBeenCalled();
    });
  });
});
