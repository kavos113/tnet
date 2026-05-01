import { ipcMain } from 'electron';
import type { TasksGlobalConfig } from '@tnet/app-tasks/shared/config';
import { tasksIpcChannels } from '@tnet/app-tasks/shared/ipc';
import { loadTasksGlobalConfig, saveTasksGlobalConfig } from './tasksConfigService';
import {
  CalendarEventOccurrenceRepository,
  CalendarSourceRepository,
  openTasksDatabase,
  TaskRepository
} from './repository';

export interface RegisterTasksIpcOptions {
  userDataDir: string;
}

export const registerTasksIpc = ({ userDataDir }: RegisterTasksIpcOptions): void => {
  const database = openTasksDatabase(userDataDir);
  const taskRepository = new TaskRepository(database);
  const calendarSourceRepository = new CalendarSourceRepository(database);
  const calendarEventOccurrenceRepository = new CalendarEventOccurrenceRepository(database);

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
  ipcMain.handle(tasksIpcChannels.calendarSources.save, async (_event, request) =>
    calendarSourceRepository.save(request)
  );
  ipcMain.handle(tasksIpcChannels.calendarSources.remove, async (_event, request) => {
    calendarSourceRepository.remove(request.sourceId);
  });
  ipcMain.handle(tasksIpcChannels.calendarOccurrences.list, async (_event, request) =>
    calendarEventOccurrenceRepository.list(request)
  );
};
