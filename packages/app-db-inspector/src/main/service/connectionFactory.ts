import type {
  DbInspectorConnection,
  DbInspectorDriverType
} from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import type { DbInspectorSecretStore } from './secretStore';

export interface WorkspaceConnectionInput {
  driver?: DbInspectorDriverType;
  databasePath?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  sslMode?: string;
  readOnly?: boolean;
}

export const connectionFromInput = (
  input: WorkspaceConnectionInput,
  secretStore: DbInspectorSecretStore,
  existing?: DbInspectorConnection
): DbInspectorConnection => {
  const driver = input.driver ?? existing?.driver ?? 'sqlite';
  if (driver === 'sqlite') {
    return {
      driver: 'sqlite',
      databasePath:
        input.databasePath ?? (existing?.driver === 'sqlite' ? existing.databasePath : ''),
      readOnly: input.readOnly ?? (existing?.driver === 'sqlite' ? existing.readOnly : true)
    };
  }

  const existingSecretId =
    existing?.driver === driver && 'passwordSecretId' in existing
      ? existing.passwordSecretId
      : undefined;
  let passwordSecretId = existingSecretId;
  if (input.password) {
    if (existingSecretId) secretStore.removeSecret(existingSecretId);
    passwordSecretId = secretStore.saveSecret(input.password);
  }

  if (driver === 'postgresql') {
    return {
      driver,
      host: input.host ?? (existing?.driver === driver ? existing.host : 'localhost'),
      port: input.port ?? (existing?.driver === driver ? existing.port : 5432),
      database: input.database ?? (existing?.driver === driver ? existing.database : ''),
      username: input.username ?? (existing?.driver === driver ? existing.username : ''),
      passwordSecretId,
      hasPassword: Boolean(passwordSecretId),
      sslMode: input.sslMode === 'require' || input.sslMode === 'disable' ? input.sslMode : 'prefer'
    };
  }

  return {
    driver,
    host: input.host ?? (existing?.driver === driver ? existing.host : 'localhost'),
    port: input.port ?? (existing?.driver === driver ? existing.port : 3306),
    database: input.database ?? (existing?.driver === driver ? existing.database : ''),
    username: input.username ?? (existing?.driver === driver ? existing.username : ''),
    passwordSecretId,
    hasPassword: Boolean(passwordSecretId),
    sslMode: input.sslMode === 'require' ? 'require' : 'disable'
  };
};
