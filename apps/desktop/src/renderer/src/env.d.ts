/// <reference types="vite/client" />

import type { TnetApi } from '@tnet/shared/ipc/contracts';

declare global {
  interface Window {
    tnet: TnetApi;
  }
}
