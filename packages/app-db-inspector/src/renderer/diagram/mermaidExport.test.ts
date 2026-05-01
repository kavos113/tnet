import { describe, expect, it } from 'vitest';
import { serializeMermaidSvg } from './mermaidExport';

describe('mermaidExport', () => {
  it('serializes SVG with XML declaration, xmlns, and concrete dimensions', () => {
    document.body.innerHTML = `
      <svg width="100%" viewBox="0 0 640 320">
        <text>Authors</text>
      </svg>
    `;
    const svg = document.querySelector('svg');
    if (!svg) throw new Error('svg missing');

    const markup = serializeMermaidSvg(svg);

    expect(markup).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(markup).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(markup).toContain('width="640"');
    expect(markup).toContain('height="320"');
    expect(markup).toContain('Authors');
  });
});
