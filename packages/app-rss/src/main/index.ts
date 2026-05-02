import { registerRssIpc } from './rssIpc';

export interface RegisterRssIpcHandlersOptions {
  userDataDir: string;
}

export const registerRssIpcHandlers = ({ userDataDir }: RegisterRssIpcHandlersOptions): void => {
  registerRssIpc({ userDataDir });
};

export * from './repository';
export * from './rssConfigService';
export * from './rssPaths';
