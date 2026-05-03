import { describe, expect, it } from 'vitest';
import type {
  RequesterRequestSnapshot,
  RequesterResponseSnapshot
} from '@tnet/app-requester/shared/requesterTypes';
import {
  getRequestLanguage,
  getResponseLanguage,
  highlightRequesterBody
} from './requesterHighlight';

describe('requesterHighlight', () => {
  it('detects response languages from preview type and content type', () => {
    expect(getResponseLanguage(response({ previewType: 'json', contentType: '' }))).toBe('json');
    expect(getResponseLanguage(response({ previewType: 'text', contentType: 'text/css' }))).toBe(
      'css'
    );
    expect(getResponseLanguage(response({ previewType: 'html', contentType: 'text/html' }))).toBe(
      'html'
    );
  });

  it('detects request languages from body metadata', () => {
    expect(getRequestLanguage(request({ previewType: 'json', contentType: '' }))).toBe('json');
    expect(
      getRequestLanguage(request({ previewType: 'text', contentType: 'application/javascript' }))
    ).toBe('javascript');
  });

  it('escapes plain text when no language is available', () => {
    expect(highlightRequesterBody('<script>', undefined)).toBe('&lt;script&gt;');
  });
});

const response = (
  input: Pick<RequesterResponseSnapshot, 'previewType' | 'contentType'>
): RequesterResponseSnapshot =>
  ({
    ...input,
    status: 200,
    statusText: 'OK',
    headers: [],
    bodyText: '',
    bodyBase64: '',
    durationMs: 1,
    byteSize: 0,
    isBodyTruncated: false
  }) as RequesterResponseSnapshot;

const request = (
  input: Pick<RequesterRequestSnapshot, 'previewType' | 'contentType'>
): RequesterRequestSnapshot =>
  ({
    ...input,
    workspaceId: 'workspace-1',
    requestName: 'Request',
    requestType: 'http',
    method: 'GET',
    url: 'https://example.test',
    executedUrl: 'https://example.test',
    headers: [],
    bodyText: '',
    bodyBase64: '',
    bodyMode: 'none',
    byteSize: 0,
    isBodyTruncated: false
  }) as RequesterRequestSnapshot;
