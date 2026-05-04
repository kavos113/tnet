import mermaid from 'mermaid';
import './markdown-preview.css';

export interface MermaidApi {
  initialize: (config: { startOnLoad: boolean; securityLevel: 'strict'; theme: 'base' }) => void;
  run: (options: { nodes: HTMLElement[] }) => Promise<void>;
}

export const prepareMermaidBlocks = (root: ParentNode): HTMLElement[] => {
  root.querySelectorAll<HTMLElement>('pre > code.language-mermaid').forEach((code) => {
    const pre = code.parentElement;
    if (!pre) return;

    const diagram = document.createElement('div');
    diagram.className = 'mermaid';
    diagram.textContent = code.textContent ?? '';
    pre.replaceWith(diagram);
  });

  return Array.from(root.querySelectorAll<HTMLElement>('.mermaid'));
};

export const renderMermaidBlocks = async (
  root: ParentNode,
  mermaidApi: MermaidApi = mermaid
): Promise<void> => {
  const nodes = prepareMermaidBlocks(root);
  if (nodes.length === 0) return;

  mermaidApi.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base'
  });

  try {
    await mermaidApi.run({ nodes });
  } catch (error) {
    showMermaidError(nodes, error);
  }
};

export const initMarkdownPreview = async (root: ParentNode = document): Promise<void> => {
  await renderMermaidBlocks(root);
};

const showMermaidError = (nodes: HTMLElement[], error: unknown): void => {
  const message = error instanceof Error ? error.message : String(error);

  nodes.forEach((node) => {
    const errorNode = document.createElement('pre');
    errorNode.className = 'mermaid-error';
    errorNode.textContent = message;
    node.after(errorNode);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void initMarkdownPreview();
  });
} else {
  void initMarkdownPreview();
}
