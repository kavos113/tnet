import { markdownToHtml, type MarkdownToHtmlOptions } from './markdownToHtml';
import { renderMermaid } from './renderMermaid';

export const markdownService = {
  parsePreviewMarkdown: (markdown: string, options: MarkdownToHtmlOptions = {}) =>
    markdownToHtml(markdown, options),
  parseTooltipMarkdown: markdownToHtml,
  renderMermaid
};
