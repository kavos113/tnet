import type { Element, Root } from 'hast';
import { visit } from 'unist-util-visit';

export const rehypeMermaid = () => {
  return (tree: Root): void => {
    visit(tree, 'element', (node: Element, index, parent: Element | Root | undefined) => {
      if (node.tagName !== 'pre' || !parent?.children || index === undefined) return;

      const codeNode = node.children[0];
      if (
        codeNode?.type !== 'element' ||
        codeNode.tagName !== 'code' ||
        !(codeNode.properties?.className as string[] | undefined)?.includes('language-mermaid')
      ) {
        return;
      }

      const textNode = codeNode.children[0];
      if (textNode?.type !== 'text') return;

      parent.children.splice(index, 1, {
        type: 'element',
        tagName: 'div',
        properties: { className: ['mermaid'] },
        children: [{ type: 'text', value: textNode.value }]
      });
    });
  };
};
