import mermaid from 'mermaid';

export const renderMermaid = async (root: ParentNode = document): Promise<void> => {
  const nodes = root.querySelectorAll<HTMLElement>('.mermaid');
  if (nodes.length === 0) return;

  mermaid.initialize({ startOnLoad: false });
  await mermaid.run({ nodes });
};
