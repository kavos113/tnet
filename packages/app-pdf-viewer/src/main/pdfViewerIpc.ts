import { ipcMain } from 'electron';
import { normalizeGlobalConfig, type GlobalConfig } from '@tnet/shared/types/config';
import {
  getPdfViewerGlobalSettings,
  withPdfViewerGlobalSettings
} from '@tnet/app-pdf-viewer/shared/config';
import { pdfViewerIpcChannels, type PdfViewerApi } from '@tnet/app-pdf-viewer/shared/ipc';
import type { PdfWorkspacePathRequest } from '@tnet/app-pdf-viewer/shared/pdfViewerTypes';
import { loadPdfBytes, openPdfExternal } from './pdfViewerFileService';

export interface PdfViewerConfigStore {
  loadGlobal: () => Promise<GlobalConfig>;
  saveGlobal: (config: GlobalConfig) => Promise<void>;
}

export const registerPdfViewerIpcHandlers = (configStore: PdfViewerConfigStore): void => {
  ipcMain.handle(pdfViewerIpcChannels.config.loadGlobal, async () =>
    getPdfViewerGlobalSettings(normalizeGlobalConfig(await configStore.loadGlobal()))
  );
  ipcMain.handle(
    pdfViewerIpcChannels.config.saveGlobal,
    async (
      _event,
      settings: Awaited<ReturnType<PdfViewerApi['pdfViewer']['config']['loadGlobal']>>
    ) => {
      const config = normalizeGlobalConfig(await configStore.loadGlobal());
      await configStore.saveGlobal(withPdfViewerGlobalSettings(config, settings));
    }
  );
  ipcMain.handle(
    pdfViewerIpcChannels.pdf.loadBytes,
    async (_event, request: PdfWorkspacePathRequest) => loadPdfBytes(request)
  );
  ipcMain.handle(
    pdfViewerIpcChannels.pdf.openExternal,
    async (_event, request: PdfWorkspacePathRequest) => openPdfExternal(request)
  );
};
