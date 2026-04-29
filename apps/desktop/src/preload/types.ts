import type { ElectronAPI } from '@electron-toolkit/preload';
import type { MarkdownApi } from '@tnet/app-markdown/shared/ipc';
import type { PapersApi } from '@tnet/app-papers/shared/ipc';
import type { TnetApi } from '@tnet/shared/ipc/contracts';

type DesktopTnetApi = TnetApi & MarkdownApi & PapersApi;

declare global {
  interface Window {
    electron: ElectronAPI;
    tnet: DesktopTnetApi;
  }
}
