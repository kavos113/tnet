import type { ElectronAPI } from '@electron-toolkit/preload';
import type { TnetApi } from '@shared/ipc/contracts';

declare global {
  interface Window {
    electron: ElectronAPI;
    tnet: TnetApi;
  }
}
