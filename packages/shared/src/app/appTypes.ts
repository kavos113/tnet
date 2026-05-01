export type AppId = 'markdown' | 'papers' | 'requester' | 'db-inspector' | 'code';

export const defaultAppId: AppId = 'markdown';

export const isAppId = (value: string | undefined): value is AppId =>
  value === 'markdown' ||
  value === 'papers' ||
  value === 'requester' ||
  value === 'db-inspector' ||
  value === 'code';
