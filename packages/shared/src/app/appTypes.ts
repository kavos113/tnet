export type AppId = 'markdown' | 'papers' | 'requester' | 'code';

export const defaultAppId: AppId = 'markdown';

export const isAppId = (value: string | undefined): value is AppId =>
  value === 'markdown' || value === 'papers' || value === 'requester' || value === 'code';
