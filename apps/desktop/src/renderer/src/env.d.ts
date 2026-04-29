/// <reference types="vite/client" />

import type { TnetApi } from '@tnet/shared/ipc/contracts';
import type { MarkdownApi } from '@tnet/app-markdown/shared/ipc';
import type { PapersApi } from '@tnet/app-papers/shared/ipc';

type DesktopTnetApi = TnetApi & MarkdownApi & PapersApi;

declare global {
  interface Window {
    tnet: DesktopTnetApi;
  }
}
