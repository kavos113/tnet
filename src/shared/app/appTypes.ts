export type AppId = 'markdown' | 'papers' | 'code';

export const defaultAppId: AppId = 'markdown';

export const isAppId = (value: string | undefined): value is AppId =>
  value === 'markdown' || value === 'papers' || value === 'code';
