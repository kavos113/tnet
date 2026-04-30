import { safeStorage } from 'electron';

export interface SecretStore {
  isAvailable(): boolean;
  encrypt(value: string): string;
  decrypt(value: string): string;
}

export const createElectronSecretStore = (): SecretStore => ({
  isAvailable: () => safeStorage.isEncryptionAvailable(),
  encrypt: (value) => safeStorage.encryptString(value).toString('base64'),
  decrypt: (value) => safeStorage.decryptString(Buffer.from(value, 'base64'))
});
