import type { Element, Root } from 'hast';
import { visit } from 'unist-util-visit';

const sourceLineTags = new Set([
  'blockquote',
  'div',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'li',
  'ol',
  'p',
  'pre',
  'table',
  'ul'
]);

export const rehypeSourceLine = () => {
  return (tree: Root): void => {
    visit(tree, 'element', (node: Element) => {
      if (!sourceLineTags.has(node.tagName)) return;
      const line = node.position?.start.line;
      if (!line) return;

      node.properties = {
        ...node.properties,
        'data-source-line': String(line)
      };
    });
  };
};
