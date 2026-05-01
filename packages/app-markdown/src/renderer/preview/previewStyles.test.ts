import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const previewCss = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../../../../packages/markdown-editor/src/renderer/preview/MarkdownPreviewContent.css'
  ),
  'utf-8'
);

describe('preview styles', () => {
  it('keeps Markdown images within the preview width', () => {
    expect(previewCss).toContain('.markdown-preview img');
    expect(previewCss).toContain('max-width: 100%');
    expect(previewCss).toContain('height: auto');
  });
});
