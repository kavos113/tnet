import fs from 'fs';
import path from 'path';
import { randomUUID } from 'node:crypto';
import { safeStorage } from 'electron';
import { requesterSecretsPath } from '../requesterPaths';

export interface SecretStore {
  isAvailable(): boolean;
  encrypt(value: string): string;
  decrypt(value: string): string;
  saveSecret(value: string): string;
  hasSecret(secretId: string): boolean;
}

interface SecretFile {
  secrets: Record<string, string>;
}

export const createElectronSecretStore = (userDataDir: string): SecretStore => {
  const secretPath = requesterSecretsPath(userDataDir);

  const readFile = (): SecretFile => {
    if (!fs.existsSync(secretPath)) return { secrets: {} };
    return JSON.parse(fs.readFileSync(secretPath, 'utf-8')) as SecretFile;
  };

  const writeFile = (file: SecretFile): void => {
    fs.mkdirSync(path.dirname(secretPath), { recursive: true });
    fs.writeFileSync(secretPath, JSON.stringify(file, null, 2), 'utf-8');
  };

  return {
    isAvailable: () => safeStorage.isEncryptionAvailable(),
    encrypt: (value) => safeStorage.encryptString(value).toString('base64'),
    decrypt: (value) => safeStorage.decryptString(Buffer.from(value, 'base64')),
    saveSecret: (value) => {
      const file = readFile();
      const id = randomUUID();
      file.secrets[id] = safeStorage.encryptString(value).toString('base64');
      writeFile(file);
      return id;
    },
    hasSecret: (secretId) => Boolean(readFile().secrets[secretId])
  };
};
