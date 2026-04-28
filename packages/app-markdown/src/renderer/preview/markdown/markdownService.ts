import { markdownToHtml } from './markdownToHtml';
import { renderMermaid } from './renderMermaid';

export const markdownService = {
  parsePreviewMarkdown: markdownToHtml,
  parseTooltipMarkdown: markdownToHtml,
  renderMermaid
};
