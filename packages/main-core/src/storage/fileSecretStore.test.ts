import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { createFileSecretStore } from './fileSecretStore';

const tempDirs: string[] = [];

const createTempDir = (): string => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnet-secrets-'));
  tempDirs.push(tempDir);
  return tempDir;
};

describe('createFileSecretStore', () => {
  afterEach(() => {
    for (const tempDir of tempDirs.splice(0)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('saves, replaces, resolves, and removes secrets', () => {
    const store = createFileSecretStore({
      filePath: path.join(createTempDir(), 'secrets.json')
    });

    const secretId = store.saveSecret('secret');
    expect(store.getSecret(secretId)).toBe('secret');
    expect(store.hasSecret(secretId)).toBe(true);

    const replacedSecretId = store.replaceSecret(secretId, 'next-secret');
    expect(replacedSecretId).toBe(secretId);
    expect(store.getSecret(secretId)).toBe('next-secret');

    store.removeSecret(secretId);
    expect(store.getSecret(secretId)).toBeUndefined();
    expect(store.hasSecret(secretId)).toBe(false);
  });

  it('uses the provided codec for persisted values', () => {
    const filePath = path.join(createTempDir(), 'secrets.json');
    const store = createFileSecretStore({
      filePath,
      codec: {
        encode: (value) => `encoded:${value}`,
        decode: (value) => value.replace(/^encoded:/, '')
      }
    });

    const secretId = store.saveSecret('secret');
    expect(fs.readFileSync(filePath, 'utf-8')).toContain('encoded:secret');
    expect(store.getSecret(secretId)).toBe('secret');
  });
});
