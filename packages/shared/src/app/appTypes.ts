export type AppId = 'tasks' | 'markdown' | 'papers' | 'requester' | 'db-inspector' | 'code';

export const defaultAppId: AppId = 'tasks';

export const isAppId = (value: string | undefined): value is AppId =>
  value === 'tasks' ||
  value === 'markdown' ||
  value === 'papers' ||
  value === 'requester' ||
  value === 'db-inspector' ||
  value === 'code';
