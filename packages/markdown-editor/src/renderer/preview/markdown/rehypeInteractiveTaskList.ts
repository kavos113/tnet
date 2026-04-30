import type { Element, Root } from 'hast';
import { visit } from 'unist-util-visit';

export const rehypeInteractiveTaskList = () => {
  return (tree: Root): void => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'input') return;
      if (node.properties?.type !== 'checkbox') return;

      const nextProperties = { ...node.properties };
      delete nextProperties.disabled;
      nextProperties['data-task-checkbox'] = 'true';
      node.properties = nextProperties;
    });
  };
};
