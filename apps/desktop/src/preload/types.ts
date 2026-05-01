import type { ElectronAPI } from '@electron-toolkit/preload';
import type { MarkdownApi } from '@tnet/app-markdown/shared/ipc';
import type { PapersApi } from '@tnet/app-papers/shared/ipc';
import type { RequesterApi } from '@tnet/app-requester/shared/ipc';
import type { DbInspectorApi } from '@tnet/app-db-inspector/shared/ipc';
import type { TasksApi } from '@tnet/app-tasks/shared/ipc';
import type { TnetApi } from '@tnet/shared/ipc/contracts';

type DesktopTnetApi = TnetApi & MarkdownApi & PapersApi & RequesterApi & DbInspectorApi & TasksApi;

declare global {
  interface Window {
    electron: ElectronAPI;
    tnet: DesktopTnetApi;
  }
}
