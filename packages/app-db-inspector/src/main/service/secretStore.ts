import fs from 'fs';
import path from 'path';
import { randomUUID } from 'node:crypto';
import { dbInspectorSecretsPath } from '../dbInspectorPaths';

export interface DbInspectorSecretStore {
  saveSecret(value: string): string;
  resolveSecret(secretId: string | undefined): string | undefined;
  removeSecret(secretId: string | undefined): void;
  hasSecret(secretId: string | undefined): boolean;
}

export const createDbInspectorSecretStore = (userDataDir: string): DbInspectorSecretStore => {
  const secretsPath = dbInspectorSecretsPath(userDataDir);
  const readSecrets = (): Record<string, string> => {
    if (!fs.existsSync(secretsPath)) return {};
    return JSON.parse(fs.readFileSync(secretsPath, 'utf8')) as Record<string, string>;
  };
  const writeSecrets = (secrets: Record<string, string>): void => {
    fs.mkdirSync(path.dirname(secretsPath), { recursive: true });
    fs.writeFileSync(secretsPath, JSON.stringify(secrets, null, 2), 'utf8');
  };

  return {
    saveSecret(value) {
      const secrets = readSecrets();
      const secretId = randomUUID();
      secrets[secretId] = value;
      writeSecrets(secrets);
      return secretId;
    },
    resolveSecret(secretId) {
      if (!secretId) return undefined;
      return readSecrets()[secretId];
    },
    removeSecret(secretId) {
      if (!secretId) return;
      const secrets = readSecrets();
      delete secrets[secretId];
      writeSecrets(secrets);
    },
    hasSecret(secretId) {
      if (!secretId) return false;
      return Object.hasOwn(readSecrets(), secretId);
    }
  };
};
