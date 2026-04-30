import { registerRequesterIpc } from './requesterIpc';

export interface RegisterRequesterIpcHandlersOptions {
  userDataDir: string;
}

export const registerRequesterIpcHandlers = ({
  userDataDir
}: RegisterRequesterIpcHandlersOptions): void => {
  registerRequesterIpc({ userDataDir });
};

export * from './requesterConfigService';
export * from './requesterPaths';
