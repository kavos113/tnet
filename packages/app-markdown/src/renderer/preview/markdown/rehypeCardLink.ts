import type { Element, Root } from 'hast';
import { visit } from 'unist-util-visit';

interface CardLinkData {
  url: string;
  title: string;
  description?: string;
  host: string;
  favicon?: string;
  image?: string;
}

const parseCardLink = (code: string): CardLinkData => {
  const data: Partial<CardLinkData> = {};
  for (const line of code.split('\n')) {
    const [key, ...rest] = line.split(':');
    if (!key || rest.length === 0) continue;
    data[key.trim() as keyof CardLinkData] = rest.join(':').trim().replace(/^"|"$/g, '');
  }

  return {
    url: data.url ?? '#',
    title: data.title ?? data.url ?? 'Link',
    description: data.description,
    host: data.host ?? data.url ?? '',
    favicon: data.favicon,
    image: data.image
  };
};

const textElement = (tagName: string, className: string, value: string): Element => ({
  type: 'element',
  tagName,
  properties: { className: [className] },
  children: [{ type: 'text', value }]
});

const makeCardLinkElement = (data: CardLinkData): Element => {
  const children: Element[] = [
    {
      type: 'element',
      tagName: 'div',
      properties: { className: ['card-content'] },
      children: [
        textElement('p', 'card-title', data.title),
        textElement('p', 'card-description', data.description ?? ''),
        {
          type: 'element',
          tagName: 'div',
          properties: { className: ['card-footer'] },
          children: [
            {
              type: 'element',
              tagName: 'span',
              properties: { className: ['card-url'] },
              children: [{ type: 'text', value: data.host }]
            }
          ]
        }
      ]
    }
  ];

  if (data.image) {
    children.push({
      type: 'element',
      tagName: 'div',
      properties: { className: ['card-thumbnail'] },
      children: [
        {
          type: 'element',
          tagName: 'img',
          properties: { src: data.image, alt: data.title },
          children: []
        }
      ]
    });
  }

  return {
    type: 'element',
    tagName: 'div',
    properties: { className: ['card-link-container'] },
    children: [
      {
        type: 'element',
        tagName: 'a',
        properties: {
          href: data.url,
          className: ['card-link'],
          target: '_blank',
          rel: 'noopener noreferrer'
        },
        children
      }
    ]
  };
};

export const rehypeCardLink = () => {
  return (tree: Root): void => {
    visit(tree, 'element', (node: Element, index, parent: Element | Root | undefined) => {
      if (node.tagName !== 'pre' || !parent?.children || index === undefined) return;

      const codeNode = node.children[0];
      if (
        codeNode?.type !== 'element' ||
        codeNode.tagName !== 'code' ||
        !(codeNode.properties?.className as string[] | undefined)?.includes('language-cardlink')
      ) {
        return;
      }

      const textNode = codeNode.children[0];
      if (textNode?.type !== 'text') return;

      parent.children.splice(index, 1, makeCardLinkElement(parseCardLink(textNode.value)));
    });
  };
};
