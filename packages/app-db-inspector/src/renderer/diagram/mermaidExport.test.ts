import { afterEach, describe, expect, it, vi } from 'vitest';
import { serializeMermaidSvg, svgMarkupToPngBase64 } from './mermaidExport';

describe('mermaidExport', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it('keeps explicit SVG dimensions and ignores invalid view boxes', () => {
    document.body.innerHTML = `
      <svg width="320" height="160" viewBox="bad values">
        <text>Invalid view box</text>
      </svg>
    `;
    const svg = document.querySelector('svg');
    if (!svg) throw new Error('svg missing');

    const markup = serializeMermaidSvg(svg);

    expect(markup).toContain('width="320"');
    expect(markup).toContain('height="160"');
    expect(markup).toContain('Invalid view box');
  });

  it('returns PNG base64 with optional background fill', async () => {
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:diagram'),
      revokeObjectURL
    });
    const context = {
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: vi.fn()
    };
    vi.spyOn(document, 'createElement').mockReturnValue({
      width: 0,
      height: 0,
      getContext: vi.fn(() => context),
      toDataURL: vi.fn(() => 'data:image/png;base64,abc123')
    } as never);
    vi.stubGlobal(
      'Image',
      class {
        naturalWidth = 10;
        naturalHeight = 5;
        onload: (() => void) | null = null;
        set src(_value: string) {
          this.onload?.();
        }
      }
    );

    await expect(
      svgMarkupToPngBase64('<svg viewBox="0 0 10 5"></svg>', {
        backgroundColor: '#fff',
        scale: 2
      })
    ).resolves.toBe('abc123');
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 20, 10);
    expect(context.drawImage).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:diagram');
  });

  it('rejects PNG export when image loading fails', async () => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:diagram'),
      revokeObjectURL: vi.fn()
    });
    vi.stubGlobal(
      'Image',
      class {
        naturalWidth = 10;
        naturalHeight = 5;
        onerror: (() => void) | null = null;
        set src(_value: string) {
          this.onerror?.();
        }
      }
    );

    await expect(svgMarkupToPngBase64('<svg></svg>')).rejects.toThrow(
      'Failed to load SVG for PNG export.'
    );
  });

  it('rejects PNG export when the canvas is too large', async () => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:diagram'),
      revokeObjectURL: vi.fn()
    });
    vi.stubGlobal(
      'Image',
      class {
        naturalWidth = 40000;
        naturalHeight = 10;
        onload: (() => void) | null = null;
        set src(_value: string) {
          this.onload?.();
        }
      }
    );

    await expect(svgMarkupToPngBase64('<svg></svg>', { scale: 1 })).rejects.toThrow(
      'Diagram is too large to export as PNG.'
    );
  });

  it('rejects PNG export when a canvas context is unavailable', async () => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:diagram'),
      revokeObjectURL: vi.fn()
    });
    vi.spyOn(document, 'createElement').mockReturnValue({
      width: 0,
      height: 0,
      getContext: vi.fn(() => null)
    } as never);
    vi.stubGlobal(
      'Image',
      class {
        naturalWidth = 10;
        naturalHeight = 5;
        onload: (() => void) | null = null;
        set src(_value: string) {
          this.onload?.();
        }
      }
    );

    await expect(svgMarkupToPngBase64('<svg></svg>', { scale: 1 })).rejects.toThrow(
      'Canvas is not available.'
    );
  });
});
