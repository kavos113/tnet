import { safeStorage } from 'electron';
import { createFileSecretStore } from '@tnet/main-core/storage/fileSecretStore';
import { requesterSecretsPath } from '../requesterPaths';

export interface SecretStore {
  isAvailable(): boolean;
  encrypt(value: string): string;
  decrypt(value: string): string;
  saveSecret(value: string): string;
  hasSecret(secretId: string): boolean;
}

export const createElectronSecretStore = (userDataDir: string): SecretStore => {
  const store = createFileSecretStore({
    filePath: requesterSecretsPath(userDataDir),
    codec: {
      encode: (value) => safeStorage.encryptString(value).toString('base64'),
      decode: (value) => safeStorage.decryptString(Buffer.from(value, 'base64'))
    }
  });

  return {
    isAvailable: () => safeStorage.isEncryptionAvailable(),
    encrypt: (value) => safeStorage.encryptString(value).toString('base64'),
    decrypt: (value) => safeStorage.decryptString(Buffer.from(value, 'base64')),
    saveSecret: store.saveSecret,
    hasSecret: store.hasSecret
  };
};
