import type { Root as MdastRoot, Text } from 'mdast';
import { visit } from 'unist-util-visit';

type InternalLinkNode = {
  type: 'link';
  url: string;
  data: {
    hProperties: {
      'data-internal-link': string;
      'data-path': string;
    };
  };
  children: Text[];
};

export const remarkInternalLinks = () => {
  return (tree: MdastRoot): void => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || typeof index !== 'number') return;

      const regex = /\[\[(.*?)]]/g;
      const nextNodes: (Text | InternalLinkNode)[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(node.value)) !== null) {
        if (match.index > lastIndex) {
          nextNodes.push({ type: 'text', value: node.value.slice(lastIndex, match.index) });
        }

        const [path, displayName] = (match[1] ?? '').split('|');
        nextNodes.push({
          type: 'link',
          url: '#',
          data: {
            hProperties: {
              'data-internal-link': 'true',
              'data-path': path
            }
          },
          children: [{ type: 'text', value: displayName || path }]
        });
        lastIndex = match.index + match[0].length;
      }

      if (nextNodes.length === 0) return;
      if (lastIndex < node.value.length) {
        nextNodes.push({ type: 'text', value: node.value.slice(lastIndex) });
      }

      parent.children.splice(index, 1, ...nextNodes);
      return index + nextNodes.length;
    });
  };
};
