// @vitest-environment node
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { normalizeRequesterWorkspaceSettings } from '@tnet/app-requester/shared/config';
import { openRequesterDatabase } from './requesterDb';
import { RequestRepository } from './requestRepository';
import { VariableSetRepository } from './variableSetRepository';
import { WorkspaceRepository } from './workspaceRepository';

const tempDir = async (name: string): Promise<string> =>
  fs.mkdtemp(path.join(os.tmpdir(), `tnet-requester-${name}-`));

const createRepositories = async (
  name: string
): Promise<{
  database: ReturnType<typeof openRequesterDatabase>;
  requestRepository: RequestRepository;
  userDataDir: string;
  variableSetRepository: VariableSetRepository;
  workspaceRepository: WorkspaceRepository;
}> => {
  const userDataDir = await tempDir(name);
  const database = openRequesterDatabase(userDataDir);
  return {
    database,
    requestRepository: new RequestRepository(database),
    userDataDir,
    variableSetRepository: new VariableSetRepository(database),
    workspaceRepository: new WorkspaceRepository(database)
  };
};

describe('Requester repositories', () => {
  it('creates the database and persists workspace settings', async () => {
    const { database, userDataDir, workspaceRepository } =
      await createRepositories('workspace-settings');
    const workspace = workspaceRepository.create('Local Dev');
    const settings = normalizeRequesterWorkspaceSettings({
      historyEnabled: false,
      requestTimeoutMs: 12000
    });

    workspaceRepository.saveSettings(workspace.id, settings);

    expect(workspaceRepository.list()).toEqual([workspace]);
    expect(workspaceRepository.getSettings(workspace.id)).toEqual(settings);
    await expect(
      fs.stat(path.join(userDataDir, 'requester', 'requester.db'))
    ).resolves.toBeTruthy();
    database.close();
  });

  it('creates, updates, duplicates, reorders, and removes requests', async () => {
    const { database, requestRepository, workspaceRepository } =
      await createRepositories('requests');
    const workspace = workspaceRepository.create('Local Dev');
    const first = requestRepository.save({
      workspaceId: workspace.id,
      name: 'Health',
      method: 'GET',
      url: 'https://example.test/health'
    });
    const second = requestRepository.save({
      workspaceId: workspace.id,
      name: 'Health',
      method: 'POST',
      url: 'https://example.test/health'
    });

    expect(first.requestPath).toBe('Health.req');
    expect(second.requestPath).toBe('Health 2.req');

    const updated = requestRepository.save({
      ...first,
      name: 'Readiness',
      method: 'GET',
      url: 'https://example.test/ready',
      bodyMode: 'json',
      bodyText: '{"ok":true}'
    });
    const duplicated = requestRepository.duplicate(updated.id);
    requestRepository.reorder(workspace.id, [duplicated.id, second.id, updated.id]);

    expect(requestRepository.get(updated.id)).toMatchObject({
      name: 'Readiness',
      bodyMode: 'json',
      bodyText: '{"ok":true}'
    });
    expect(requestRepository.list(workspace.id).map((request) => request.id)).toEqual([
      duplicated.id,
      second.id,
      updated.id
    ]);

    requestRepository.remove(second.id);
    expect(requestRepository.list(workspace.id).map((request) => request.id)).toEqual([
      duplicated.id,
      updated.id
    ]);
    database.close();
  });

  it('creates and removes variable sets', async () => {
    const { database, variableSetRepository, workspaceRepository } =
      await createRepositories('variable-sets');
    const workspace = workspaceRepository.create('Local Dev');
    const variableSet = variableSetRepository.save({
      workspaceId: workspace.id,
      name: 'Local'
    });

    expect(variableSetRepository.list(workspace.id)).toEqual([variableSet]);

    variableSetRepository.remove(variableSet.id);
    expect(variableSetRepository.list(workspace.id)).toEqual([]);
    database.close();
  });
});
