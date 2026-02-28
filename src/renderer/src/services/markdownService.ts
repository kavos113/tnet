import { markdownToHtml, renderMermaid } from '@renderer/scripts/markdownUtils';

class MarkdownService {
  async parse(markdown: string): Promise<string> {
    return markdownToHtml(markdown);
  }

  renderMermaidDiagrams(): void {
    renderMermaid();
  }
}

export const markdownService = new MarkdownService();
