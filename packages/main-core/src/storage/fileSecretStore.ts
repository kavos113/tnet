import fs from 'fs';
import path from 'path';
import { randomUUID } from 'node:crypto';

export interface SecretCodec {
  encode: (value: string) => string;
  decode: (value: string) => string;
}

export interface FileSecretStore {
  saveSecret: (value: string) => string;
  replaceSecret: (secretId: string | undefined, value: string) => string;
  getSecret: (secretId: string | undefined) => string | undefined;
  removeSecret: (secretId: string | undefined) => void;
  hasSecret: (secretId: string | undefined) => boolean;
}

interface SecretSnapshot {
  secrets: Record<string, string>;
}

const plainTextCodec: SecretCodec = {
  encode: (value) => value,
  decode: (value) => value
};

export const createFileSecretStore = ({
  filePath,
  codec = plainTextCodec
}: {
  filePath: string;
  codec?: SecretCodec;
}): FileSecretStore => {
  const load = (): SecretSnapshot => {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as SecretSnapshot;
    } catch {
      return { secrets: {} };
    }
  };

  const save = (snapshot: SecretSnapshot): void => {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
  };

  return {
    saveSecret(value) {
      const snapshot = load();
      const secretId = randomUUID();
      snapshot.secrets[secretId] = codec.encode(value);
      save(snapshot);
      return secretId;
    },
    replaceSecret(secretId, value) {
      const snapshot = load();
      const nextSecretId = secretId || randomUUID();
      snapshot.secrets[nextSecretId] = codec.encode(value);
      save(snapshot);
      return nextSecretId;
    },
    getSecret(secretId) {
      if (!secretId) return undefined;
      const encoded = load().secrets[secretId];
      return encoded === undefined ? undefined : codec.decode(encoded);
    },
    removeSecret(secretId) {
      if (!secretId) return;
      const snapshot = load();
      delete snapshot.secrets[secretId];
      save(snapshot);
    },
    hasSecret(secretId) {
      if (!secretId) return false;
      return Object.hasOwn(load().secrets, secretId);
    }
  };
};
