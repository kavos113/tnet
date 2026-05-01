import { registerDbInspectorIpc } from './dbInspectorIpc';

export interface RegisterDbInspectorIpcHandlersOptions {
  userDataDir: string;
}

export const registerDbInspectorIpcHandlers = ({
  userDataDir
}: RegisterDbInspectorIpcHandlersOptions): void => {
  registerDbInspectorIpc({ userDataDir });
};

export * from './dbInspectorConfigService';
export * from './dbInspectorPaths';
