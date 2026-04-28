import type { ElectronAPI } from '@electron-toolkit/preload';
import type { MarkdownApi } from '@tnet/app-markdown/shared/ipc';
import type { TnetApi } from '@tnet/shared/ipc/contracts';

type DesktopTnetApi = TnetApi & MarkdownApi;

declare global {
  interface Window {
    electron: ElectronAPI;
    tnet: DesktopTnetApi;
  }
}
