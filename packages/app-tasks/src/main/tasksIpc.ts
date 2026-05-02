import { ipcMain, shell } from 'electron';
import type { TasksGlobalConfig } from '@tnet/app-tasks/shared/config';
import { tasksIpcChannels } from '@tnet/app-tasks/shared/ipc';
import { loadTasksGlobalConfig, saveTasksGlobalConfig } from './tasksConfigService';
import {
  CalendarEventOccurrenceRepository,
  CalendarSourceRepository,
  LocalEventRepository,
  openTasksDatabase,
  SubscribedTaskOccurrenceRepository,
  TaskRepository
} from './repository';
import { IcalSyncService } from './icalSyncService';
import { GoogleCalendarService } from './googleCalendarService';
import { describeTasksRuntimeConfigPath, loadTasksRuntimeConfig } from './tasksRuntimeConfig';
import { createTasksSecretStore } from './tasksSecretStore';

export interface RegisterTasksIpcOptions {
  userDataDir: string;
}

export const registerTasksIpc = ({ userDataDir }: RegisterTasksIpcOptions): void => {
  const database = openTasksDatabase(userDataDir);
  const taskRepository = new TaskRepository(database);
  const calendarSourceRepository = new CalendarSourceRepository(database);
  const calendarEventOccurrenceRepository = new CalendarEventOccurrenceRepository(database);
  const subscribedTaskOccurrenceRepository = new SubscribedTaskOccurrenceRepository(database);
  const localEventRepository = new LocalEventRepository(database);
  const secretStore = createTasksSecretStore(userDataDir);
  const runtimeConfigPath = describeTasksRuntimeConfigPath(userDataDir);
  const runtimeConfig = loadTasksRuntimeConfig(userDataDir);
  const googleCalendarService = new GoogleCalendarService(calendarSourceRepository, secretStore, {
    credentialsPath: runtimeConfig.googleCalendarCredentialsPath,
    runtimeConfigPath
  });
  const syncService = new IcalSyncService(
    calendarSourceRepository,
    calendarEventOccurrenceRepository,
    subscribedTaskOccurrenceRepository,
    secretStore,
    googleCalendarService,
    {
      calendarHttpUserAgent: runtimeConfig.calendarHttpUserAgent
    }
  );

  ipcMain.handle(tasksIpcChannels.config.loadGlobal, async () =>
    loadTasksGlobalConfig(userDataDir)
  );
  ipcMain.handle(tasksIpcChannels.config.saveGlobal, async (_event, config: TasksGlobalConfig) =>
    saveTasksGlobalConfig(userDataDir, config)
  );

  ipcMain.handle(tasksIpcChannels.tasks.list, async (_event, request) =>
    taskRepository.list(request)
  );
  ipcMain.handle(tasksIpcChannels.tasks.save, async (_event, request) =>
    taskRepository.save(request)
  );
  ipcMain.handle(tasksIpcChannels.tasks.complete, async (_event, request) =>
    taskRepository.complete(request.taskId, request.completed)
  );
  ipcMain.handle(tasksIpcChannels.tasks.remove, async (_event, request) => {
    taskRepository.remove(request.taskId);
  });

  ipcMain.handle(tasksIpcChannels.categories.list, async () => taskRepository.listCategories());
  ipcMain.handle(tasksIpcChannels.calendarSources.list, async () =>
    calendarSourceRepository.list()
  );
  ipcMain.handle(tasksIpcChannels.calendarSources.save, async (_event, request) => {
    const passwordSecretId = request.password
      ? secretStore.saveSecret(request.password)
      : request.passwordSecretId;
    return calendarSourceRepository.save({
      ...request,
      password: undefined,
      passwordSecretId
    });
  });
  ipcMain.handle(tasksIpcChannels.calendarSources.remove, async (_event, request) => {
    calendarSourceRepository.remove(request.sourceId);
  });
  ipcMain.handle(tasksIpcChannels.calendarSources.authorizeGoogle, async (_event, request) => {
    if (request.code) {
      return {
        source: await googleCalendarService.completeAuth(request.sourceId, request.code)
      };
    }
    return {
      source: await googleCalendarService.authorizeWithLocalCallback(request.sourceId, (authUrl) =>
        shell.openExternal(authUrl)
      )
    };
  });
  ipcMain.handle(tasksIpcChannels.calendarOccurrences.list, async (_event, request) =>
    calendarEventOccurrenceRepository.list(request)
  );
  ipcMain.handle(tasksIpcChannels.subscribedTaskOccurrences.list, async (_event, request) =>
    subscribedTaskOccurrenceRepository.list(request)
  );
  ipcMain.handle(tasksIpcChannels.localEvents.list, async (_event, request) =>
    localEventRepository.list(request)
  );
  ipcMain.handle(tasksIpcChannels.localEvents.save, async (_event, request) =>
    localEventRepository.save(request)
  );
  ipcMain.handle(tasksIpcChannels.localEvents.remove, async (_event, request) => {
    localEventRepository.remove(request.eventId);
  });
  ipcMain.handle(tasksIpcChannels.sync.manual, async (_event, request) =>
    syncService.sync(request?.sourceId)
  );
  ipcMain.handle(tasksIpcChannels.sync.writeTask, async (_event, request) =>
    syncService.writeTask(request.sourceId, request.task)
  );
  ipcMain.handle(tasksIpcChannels.secrets.has, async (_event, request) => ({
    exists: secretStore.hasSecret(request.secretId)
  }));
};
