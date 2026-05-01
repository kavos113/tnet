import fs from 'fs';
import path from 'path';
import { randomUUID } from 'node:crypto';
import { tasksSecretsPath } from './tasksPaths';

interface SecretSnapshot {
  secrets: Record<string, string>;
}

export interface TasksSecretStore {
  saveSecret: (value: string) => string;
  getSecret: (secretId: string | undefined) => string | undefined;
  hasSecret: (secretId: string | undefined) => boolean;
}

export const createTasksSecretStore = (userDataDir: string): TasksSecretStore => {
  const filePath = tasksSecretsPath(userDataDir);

  const load = (): SecretSnapshot => {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as SecretSnapshot;
    } catch {
      return { secrets: {} };
    }
  };

  const save = (snapshot: SecretSnapshot): void => {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(snapshot), 'utf-8');
  };

  return {
    saveSecret: (value) => {
      const snapshot = load();
      const secretId = randomUUID();
      snapshot.secrets[secretId] = value;
      save(snapshot);
      return secretId;
    },
    getSecret: (secretId) => (secretId ? load().secrets[secretId] : undefined),
    hasSecret: (secretId) => Boolean(secretId && load().secrets[secretId])
  };
};
