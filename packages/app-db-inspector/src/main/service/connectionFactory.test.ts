import { describe, expect, it } from 'vitest';
import { connectionFromInput } from './connectionFactory';
import type { DbInspectorSecretStore } from './secretStore';

const createMemorySecretStore = (): DbInspectorSecretStore & {
  removed: string[];
  values: Map<string, string>;
} => {
  const values = new Map<string, string>();
  const removed: string[] = [];
  let nextId = 0;
  return {
    values,
    removed,
    saveSecret(value) {
      nextId += 1;
      const secretId = `secret-${nextId}`;
      values.set(secretId, value);
      return secretId;
    },
    resolveSecret(secretId) {
      return secretId ? values.get(secretId) : undefined;
    },
    removeSecret(secretId) {
      if (!secretId) return;
      removed.push(secretId);
      values.delete(secretId);
    },
    hasSecret(secretId) {
      return secretId ? values.has(secretId) : false;
    }
  };
};

describe('connectionFromInput', () => {
  it('stores PostgreSQL passwords in the secret store and returns a sanitized connection', () => {
    const secretStore = createMemorySecretStore();

    const connection = connectionFromInput(
      {
        driver: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: 'app',
        username: 'user',
        password: 'secret',
        sslMode: 'require'
      },
      secretStore
    );

    expect(connection).toMatchObject({
      driver: 'postgresql',
      hasPassword: true,
      passwordSecretId: 'secret-1'
    });
    expect(JSON.stringify(connection)).not.toContain('"secret"');
    expect(secretStore.resolveSecret('secret-1')).toBe('secret');
  });

  it('keeps the existing secret when password is blank', () => {
    const secretStore = createMemorySecretStore();
    const existing = connectionFromInput(
      {
        driver: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'app',
        username: 'user',
        password: 'old'
      },
      secretStore
    );

    const updated = connectionFromInput(
      {
        driver: 'mysql',
        host: 'db.local',
        database: 'app2',
        username: 'user2',
        password: ''
      },
      secretStore,
      existing
    );

    expect(updated).toMatchObject({
      driver: 'mysql',
      host: 'db.local',
      passwordSecretId: 'secret-1'
    });
    expect(secretStore.removed).toEqual([]);
  });

  it('removes the previous secret when password is replaced', () => {
    const secretStore = createMemorySecretStore();
    const existing = connectionFromInput(
      {
        driver: 'postgresql',
        host: 'localhost',
        database: 'app',
        username: 'user',
        password: 'old'
      },
      secretStore
    );

    const updated = connectionFromInput(
      {
        driver: 'postgresql',
        password: 'new'
      },
      secretStore,
      existing
    );

    expect(secretStore.removed).toEqual(['secret-1']);
    expect(updated).toMatchObject({ passwordSecretId: 'secret-2', hasPassword: true });
    expect(secretStore.resolveSecret('secret-2')).toBe('new');
  });
});
