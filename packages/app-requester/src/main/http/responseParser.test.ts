import { describe, expect, it } from 'vitest';
import { parseRequesterBufferedResponse } from './responseParser';

describe('parseRequesterBufferedResponse', () => {
  it('detects rich response preview types from content type', async () => {
    const cases: Array<{ contentType: string; expectedPreviewType: string; body?: string }> = [
      { contentType: 'application/json', expectedPreviewType: 'json', body: '{"ok":true}' },
      { contentType: 'text/html; charset=utf-8', expectedPreviewType: 'html', body: '<h1>ok</h1>' },
      {
        contentType: 'application/xhtml+xml',
        expectedPreviewType: 'html',
        body: '<html><body>ok</body></html>'
      },
      { contentType: 'text/css', expectedPreviewType: 'text', body: 'body { color: red; }' },
      { contentType: 'image/png', expectedPreviewType: 'image', body: 'png' },
      { contentType: 'application/pdf', expectedPreviewType: 'pdf', body: '%PDF' }
    ];

    for (const testCase of cases) {
      const response = new Response(testCase.body ?? 'ok', {
        status: 200,
        headers: { 'content-type': testCase.contentType }
      });

      await expect(parseRequesterBufferedResponse(response, 12)).resolves.toMatchObject({
        previewType: testCase.expectedPreviewType
      });
    }
  });
});
