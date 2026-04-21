import { markdownToHtml } from './markdownToHtml';
import { renderMermaid } from './renderMermaid';

export const markdownService = {
  parse: markdownToHtml,
  renderMermaid
};
