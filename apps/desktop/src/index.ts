import { app, BrowserWindow } from 'electron';
import { electronApp, optimizer } from '@electron-toolkit/utils';
import { createPapersServerSupervisor, type PapersServerSupervisor } from '@tnet/app-papers/main';
import { createWindow } from './app/createWindow';
import { installDevtools } from './app/installDevtools';
import { registerIpcHandlers } from './ipc/registerIpcHandlers';

const hasSingleInstanceLock = app.requestSingleInstanceLock();
let papersServerSupervisor: PapersServerSupervisor | null = null;

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.whenReady().then(async () => {
    electronApp.setAppUserModelId('com.tnet.app');

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window);
    });

    await installDevtools();
    papersServerSupervisor = createPapersServerSupervisor();
    await papersServerSupervisor.start();
    registerIpcHandlers();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('before-quit', () => {
  void papersServerSupervisor?.stop();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
