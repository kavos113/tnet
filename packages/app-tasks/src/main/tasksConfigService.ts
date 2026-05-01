import { readJsonFileOrDefault, writeJsonFile } from '@tnet/main-core/storage/jsonFile';
import type { TasksGlobalConfig } from '@tnet/app-tasks/shared/config';
import { defaultTasksGlobalConfig } from '@tnet/app-tasks/shared/config';
import { tasksGlobalConfigPath } from './tasksPaths';

export const loadTasksGlobalConfig = async (userDataDir: string): Promise<TasksGlobalConfig> => {
  const config = await readJsonFileOrDefault(
    tasksGlobalConfigPath(userDataDir),
    defaultTasksGlobalConfig()
  );

  return {
    ...defaultTasksGlobalConfig(),
    ...config
  };
};

export const saveTasksGlobalConfig = async (
  userDataDir: string,
  config: TasksGlobalConfig
): Promise<void> => {
  await writeJsonFile(tasksGlobalConfigPath(userDataDir), config);
};
