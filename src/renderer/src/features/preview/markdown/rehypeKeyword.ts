import type { Element, Root } from 'hast';
import type { Root as MdastRoot } from 'mdast';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { remarkInternalLinks } from './remarkInternalLinks';

const keywordRegex = /<keyword[^>]*>([\s\S]*?)<\/keyword>/;

const keywordClassName = (type: string | undefined): string => {
  return type === 'e' ? 'keyword-emphasized' : 'keyword-normal';
};

const parseKeywordContent = (content: string): Root => {
  const processor = unified()
    .use(remarkParse)
    .use(remarkBreaks)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkInternalLinks)
    .use(remarkRehype, { allowDangerousHtml: true });

  const mdast = processor.parse(content) as MdastRoot;
  return processor.runSync(mdast) as Root;
};

export const rehypeKeyword = (source: string) => {
  return () => {
    return (tree: Root): void => {
      visit(tree, 'element', (node: Element, index, parent: Element | Root | undefined) => {
        if (node.tagName !== 'keyword' || !parent?.children || index === undefined) return;

        const keywordSource =
          node.position?.start.offset !== undefined && node.position.end.offset !== undefined
            ? source.slice(node.position.start.offset, node.position.end.offset)
            : '';
        const content = keywordRegex.exec(keywordSource)?.[1] ?? '';
        const innerTree = parseKeywordContent(content);
        const name = (node.properties?.name as string | undefined) || 'keyword';
        const type = node.properties?.type as string | undefined;

        parent.children[index] = {
          type: 'element',
          tagName: 'div',
          position: node.position,
          properties: { className: ['keyword', keywordClassName(type)] },
          children: [
            {
              type: 'element',
              tagName: 'h4',
              properties: { className: ['keyword-title'] },
              children: [{ type: 'text', value: name }]
            },
            {
              type: 'element',
              tagName: 'div',
              properties: { className: ['keyword-content'] },
              children: innerTree.children as Element[]
            }
          ]
        };
      });
    };
  };
};
