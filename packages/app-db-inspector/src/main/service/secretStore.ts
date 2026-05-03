import { createFileSecretStore } from '@tnet/main-core/storage/fileSecretStore';
import { dbInspectorSecretsPath } from '../dbInspectorPaths';

export interface DbInspectorSecretStore {
  saveSecret(value: string): string;
  resolveSecret(secretId: string | undefined): string | undefined;
  removeSecret(secretId: string | undefined): void;
  hasSecret(secretId: string | undefined): boolean;
}

export const createDbInspectorSecretStore = (userDataDir: string): DbInspectorSecretStore => {
  const store = createFileSecretStore({ filePath: dbInspectorSecretsPath(userDataDir) });

  return {
    saveSecret: store.saveSecret,
    resolveSecret: store.getSecret,
    removeSecret: store.removeSecret,
    hasSecret: store.hasSecret
  };
};
