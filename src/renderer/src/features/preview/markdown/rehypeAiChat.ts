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

type AiChatTagName = 'question' | 'answer';

const aiChatTagNames = new Set<string>(['question', 'answer']);

const parseAiChatContent = (content: string): Root => {
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

const getTagContent = (source: string, tagName: AiChatTagName, node: Element): string => {
  const startOffset = node.position?.start.offset;
  const endOffset = node.position?.end.offset;
  if (startOffset === undefined || endOffset === undefined) return '';

  const tagSource = source.slice(startOffset, endOffset);
  const match = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i').exec(tagSource);
  return match?.[1]?.trim() ?? '';
};

const aiChatRoleLabel = (tagName: AiChatTagName): string => {
  return tagName === 'question' ? 'Question' : 'Answer';
};

export const rehypeAiChat = (source: string) => {
  return () => {
    return (tree: Root): void => {
      visit(tree, 'element', (node: Element, index, parent: Element | Root | undefined) => {
        if (!aiChatTagNames.has(node.tagName) || !parent?.children || index === undefined) return;

        const tagName = node.tagName as AiChatTagName;
        const content = getTagContent(source, tagName, node);
        const innerTree = parseAiChatContent(content);

        parent.children[index] = {
          type: 'element',
          tagName: 'div',
          position: node.position,
          properties: {
            className: ['ai-chat-message', `ai-chat-${tagName}`],
            dataAiChatRole: tagName
          },
          children: [
            {
              type: 'element',
              tagName: 'div',
              properties: { className: ['ai-chat-role'] },
              children: [{ type: 'text', value: aiChatRoleLabel(tagName) }]
            },
            {
              type: 'element',
              tagName: 'div',
              properties: { className: ['ai-chat-content'] },
              children: innerTree.children as Element[]
            }
          ]
        };
      });
    };
  };
};
