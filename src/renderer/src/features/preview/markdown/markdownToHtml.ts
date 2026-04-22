import { unified } from 'unified';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { convertObsidianImageLinks, type ObsidianImageSrcResolver } from './obsidianImages';
import { rehypeCardLink } from './rehypeCardLink';
import { rehypeKeyword } from './rehypeKeyword';
import { rehypeMermaid } from './rehypeMermaid';
import { rehypeSourceLine } from './rehypeSourceLine';
import { remarkInternalLinks } from './remarkInternalLinks';

export interface MarkdownToHtmlOptions {
  resolveImageSrc?: ObsidianImageSrcResolver;
}

export const markdownToHtml = async (
  markdown: string,
  options: MarkdownToHtmlOptions = {}
): Promise<string> => {
  const source = await convertObsidianImageLinks(markdown, options.resolveImageSrc);
  const file = await unified()
    .use(remarkParse)
    .use(remarkBreaks)
    .use(remarkGfm)
    .use(remarkInternalLinks)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeKeyword(source))
    .use(rehypeSourceLine)
    .use(rehypeSlug)
    .use(rehypeKatex)
    .use(rehypeHighlight)
    .use(rehypeMermaid)
    .use(rehypeCardLink)
    .use(rehypeStringify)
    .process(source);

  return file.toString();
};
