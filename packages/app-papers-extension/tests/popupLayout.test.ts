import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('popup layout', () => {
  it('keeps the popup viewport dimensions stable', () => {
    const html = readFileSync(resolve(__dirname, '../src/popup/index.html'), 'utf8');

    expect(html).toContain('width: 460px;');
    expect(html).toContain('min-height: 640px;');
  });
});
