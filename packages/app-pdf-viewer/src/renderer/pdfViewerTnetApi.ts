import { getTnetApi } from '@tnet/renderer-core/tnetApi';
import type { TnetApi } from '@tnet/shared/ipc/contracts';
import type { PdfViewerApi } from '@tnet/app-pdf-viewer/shared/ipc';

export type PdfViewerTnetApi = TnetApi & PdfViewerApi;

const getPdfViewerApi = (): PdfViewerTnetApi => getTnetApi<PdfViewerTnetApi>();

export const pdfViewerTnetApi: PdfViewerTnetApi = {
  workspace: {
    openDirectory: () => getPdfViewerApi().workspace.openDirectory(),
    getFileTree: (rootDir) => getPdfViewerApi().workspace.getFileTree(rootDir)
  },
  file: {
    read: (request) => getPdfViewerApi().file.read(request),
    openWithDefaultApp: (request) => getPdfViewerApi().file.openWithDefaultApp(request),
    createDirectory: (request) => getPdfViewerApi().file.createDirectory(request),
    rename: (request) => getPdfViewerApi().file.rename(request),
    move: (request) => getPdfViewerApi().file.move(request)
  },
  session: {
    load: (rootDir) => getPdfViewerApi().session.load(rootDir),
    save: (rootDir, session) => getPdfViewerApi().session.save(rootDir, session)
  },
  config: {
    loadGlobal: () => getPdfViewerApi().config.loadGlobal(),
    saveGlobal: (config) => getPdfViewerApi().config.saveGlobal(config)
  },
  pdfViewer: {
    config: {
      loadGlobal: () => getPdfViewerApi().pdfViewer.config.loadGlobal(),
      saveGlobal: (config) => getPdfViewerApi().pdfViewer.config.saveGlobal(config)
    },
    pdf: {
      loadBytes: (request) => getPdfViewerApi().pdfViewer.pdf.loadBytes(request),
      openExternal: (request) => getPdfViewerApi().pdfViewer.pdf.openExternal(request)
    }
  }
};
