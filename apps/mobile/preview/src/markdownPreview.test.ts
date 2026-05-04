// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { prepareMermaidBlocks, renderMermaidBlocks, type MermaidApi } from './markdownPreview';

const createMermaidApi = (): MermaidApi => ({
  initialize: vi.fn(),
  run: vi.fn().mockResolvedValue(undefined)
});

describe('markdownPreview', () => {
  it('converts flexmark mermaid code blocks into mermaid nodes', () => {
    document.body.innerHTML = '<pre><code class="language-mermaid">graph TD</code></pre>';

    const nodes = prepareMermaidBlocks(document);

    expect(nodes).toHaveLength(1);
    expect(document.querySelector('pre > code.language-mermaid')).toBeNull();
    expect(document.querySelector('.mermaid')?.textContent).toBe('graph TD');
  });

  it('keeps non-mermaid code blocks unchanged', () => {
    document.body.innerHTML = '<pre><code class="language-kotlin">val x = 1</code></pre>';

    const nodes = prepareMermaidBlocks(document);

    expect(nodes).toHaveLength(0);
    expect(document.querySelector('pre > code.language-kotlin')).not.toBeNull();
  });

  it('runs mermaid only when diagram nodes exist', async () => {
    document.body.innerHTML = '<pre><code class="language-mermaid">graph TD</code></pre>';
    const mermaidApi = createMermaidApi();

    await renderMermaidBlocks(document, mermaidApi);

    expect(mermaidApi.initialize).toHaveBeenCalledWith({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base'
    });
    expect(mermaidApi.run).toHaveBeenCalledWith({
      nodes: [document.querySelector('.mermaid')]
    });
  });

  it('does not run mermaid when no diagram nodes exist', async () => {
    document.body.innerHTML = '<p>No diagram</p>';
    const mermaidApi = createMermaidApi();

    await renderMermaidBlocks(document, mermaidApi);

    expect(mermaidApi.initialize).not.toHaveBeenCalled();
    expect(mermaidApi.run).not.toHaveBeenCalled();
  });

  it('shows mermaid render errors next to diagrams', async () => {
    document.body.innerHTML = '<pre><code class="language-mermaid">graph TD</code></pre>';
    const mermaidApi = createMermaidApi();
    vi.mocked(mermaidApi.run).mockRejectedValue(new Error('Invalid diagram'));

    await renderMermaidBlocks(document, mermaidApi);

    expect(document.querySelector('.mermaid-error')?.textContent).toBe('Invalid diagram');
  });
});
