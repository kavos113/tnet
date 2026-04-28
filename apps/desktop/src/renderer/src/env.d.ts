/// <reference types="vite/client" />

import type { TnetApi } from '@tnet/shared/ipc/contracts';
import type { MarkdownApi } from '@tnet/app-markdown/shared/ipc';

type DesktopTnetApi = TnetApi & MarkdownApi;

declare global {
  interface Window {
    tnet: DesktopTnetApi;
  }
}
