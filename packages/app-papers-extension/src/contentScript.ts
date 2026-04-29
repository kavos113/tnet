import { readPaperPageMetadata } from './paperPageMetadata';

chrome?.runtime?.onMessage?.addListener((message, _sender, sendResponse) => {
  if (!isReadMetadataMessage(message)) return false;

  sendResponse(readPaperPageMetadata(document));
  return true;
});

const isReadMetadataMessage = (message: unknown): message is { type: 'tnet:paper:read-metadata' } =>
  typeof message === 'object' &&
  message !== null &&
  'type' in message &&
  message.type === 'tnet:paper:read-metadata';
