import {
  markdownToHtml as renderMarkdownToHtml,
  type MarkdownToHtmlOptions
} from '@tnet/markdown-editor/renderer';
import { rehypeAiChat } from './rehypeAiChat';
import { rehypeKeyword } from './rehypeKeyword';
import { remarkInternalLinks } from './remarkInternalLinks';

export type { MarkdownToHtmlOptions };

export const markdownToHtml = async (
  markdown: string,
  options: MarkdownToHtmlOptions = {}
): Promise<string> =>
  renderMarkdownToHtml(markdown, {
    ...options,
    remarkPlugins: [remarkInternalLinks, ...(options.remarkPlugins ?? [])],
    rehypePlugins: [
      rehypeAiChat(markdown),
      rehypeKeyword(markdown),
      ...(options.rehypePlugins ?? [])
    ]
  });
