import type { Element, Root } from 'hast';
import { visit } from 'unist-util-visit';
import { isPdfLinkHref } from '@tnet/app-pdf-viewer/shared/pdfLink';

export const rehypePdfLinks = () => {
  return (tree: Root): void => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'a') return;
      const href = node.properties?.href;
      if (typeof href !== 'string' || !isPdfLinkHref(href)) return;

      node.properties = {
        ...node.properties,
        'data-pdf-link': 'true',
        'data-pdf-target': href
      };
    });
  };
};
