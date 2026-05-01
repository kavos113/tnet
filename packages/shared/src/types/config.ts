import { defaultAppId, type AppId } from '@tnet/shared/app/appTypes';

export interface GlobalConfig {
  activeAppId?: AppId;
  apps?: Partial<Record<AppId, unknown>>;
}

export const defaultGlobalConfig = (): GlobalConfig => ({
  activeAppId: defaultAppId,
  apps: {
    tasks: {},
    markdown: {},
    papers: {},
    requester: {},
    'db-inspector': {},
    code: {}
  }
});

export const normalizeGlobalConfig = (config: GlobalConfig): GlobalConfig => {
  const defaults = defaultGlobalConfig();

  return {
    ...defaults,
    ...config,
    apps: {
      ...defaults.apps,
      ...config.apps
    }
  };
};
