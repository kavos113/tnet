import { registerTasksIpc } from './tasksIpc';

export interface RegisterTasksIpcHandlersOptions {
  userDataDir: string;
}

export const registerTasksIpcHandlers = ({
  userDataDir
}: RegisterTasksIpcHandlersOptions): void => {
  registerTasksIpc({ userDataDir });
};

export * from './repository';
export * from './tasksConfigService';
export * from './tasksPaths';
