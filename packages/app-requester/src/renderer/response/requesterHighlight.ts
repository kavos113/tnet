import hljs from 'highlight.js/lib/core';
import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import php from 'highlight.js/lib/languages/php';
import xml from 'highlight.js/lib/languages/xml';
import type {
  RequesterRequestSnapshot,
  RequesterResponseSnapshot
} from '@tnet/app-requester/shared/requesterTypes';

hljs.registerLanguage('css', css);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('php', php);

export const highlightRequesterBody = (bodyText: string, language?: string): string =>
  language
    ? hljs.highlight(bodyText, { language, ignoreIllegals: true }).value
    : escapeHtml(bodyText);

export const getResponseLanguage = (response: RequesterResponseSnapshot): string | undefined => {
  const contentType = response.contentType.toLowerCase();
  if (response.previewType === 'json' || contentType.includes('json')) return 'json';
  if (response.previewType === 'html' || contentType.includes('html')) return 'html';
  if (contentType.includes('css')) return 'css';
  if (contentType.includes('javascript') || contentType.includes('ecmascript')) {
    return 'javascript';
  }
  if (contentType.includes('php')) return 'php';
  return undefined;
};

export const getRequestLanguage = (request: RequesterRequestSnapshot): string | undefined => {
  const contentType = request.contentType.toLowerCase();
  if (request.previewType === 'json' || contentType.includes('json')) return 'json';
  if (request.previewType === 'html' || contentType.includes('html')) return 'html';
  if (contentType.includes('css')) return 'css';
  if (contentType.includes('javascript') || contentType.includes('ecmascript')) {
    return 'javascript';
  }
  if (contentType.includes('php')) return 'php';
  return undefined;
};

export const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
