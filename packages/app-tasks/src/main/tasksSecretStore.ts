import { createFileSecretStore } from '@tnet/main-core/storage/fileSecretStore';
import { tasksSecretsPath } from './tasksPaths';

export interface TasksSecretStore {
  saveSecret: (value: string) => string;
  replaceSecret: (secretId: string | undefined, value: string) => string;
  getSecret: (secretId: string | undefined) => string | undefined;
  hasSecret: (secretId: string | undefined) => boolean;
}

export const createTasksSecretStore = (userDataDir: string): TasksSecretStore => {
  const store = createFileSecretStore({ filePath: tasksSecretsPath(userDataDir) });

  return {
    saveSecret: store.saveSecret,
    replaceSecret: store.replaceSecret,
    getSecret: store.getSecret,
    hasSecret: store.hasSecret
  };
};
