/// <reference types="vite/client" />

import type { TnetApi } from '@shared/ipc/contracts';

declare global {
  interface Window {
    tnet: TnetApi;
  }
}
