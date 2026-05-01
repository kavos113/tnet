import fs from 'fs/promises';
import { dialog } from 'electron';
import { normalizeRequesterWorkspaceSettings } from '@tnet/app-requester/shared/config';
import type { RequesterWorkspaceBackup } from '@tnet/app-requester/shared/backupTypes';
import type {
  RequesterRequestDetail,
  SaveRequesterRequestInput
} from '@tnet/app-requester/shared/requesterTypes';
import type {
  CookieRepository,
  HistoryRepository,
  RequestRepository,
  VariableSetRepository,
  WorkspaceRepository
} from '../repository';

interface RequesterBackupRepositories {
  cookieRepository: CookieRepository;
  historyRepository: HistoryRepository;
  requestRepository: RequestRepository;
  variableSetRepository: VariableSetRepository;
  workspaceRepository: WorkspaceRepository;
}

export class RequesterBackupService {
  constructor(private readonly repositories: RequesterBackupRepositories) {}

  async exportWorkspace(workspaceId: string): Promise<string | null> {
    const workspace = this.repositories.workspaceRepository.get(workspaceId);
    const result = await dialog.showSaveDialog({
      defaultPath: `${workspace?.name ?? 'requester-workspace'}.tnet-requester.json`
    });
    if (result.canceled || !result.filePath) return null;
    await this.exportWorkspaceToFile(workspaceId, result.filePath);
    return result.filePath;
  }

  async importWorkspace(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Requester backup', extensions: ['json'] }]
    });
    if (result.canceled || !result.filePaths[0]) return null;
    return this.importWorkspaceFromFile(result.filePaths[0]);
  }

  async exportWorkspaceToFile(workspaceId: string, filePath: string): Promise<void> {
    const workspace = this.repositories.workspaceRepository.get(workspaceId);
    if (!workspace) throw new Error(`Workspace not found: ${workspaceId}`);
    const requests = this.repositories.requestRepository
      .list(workspaceId)
      .flatMap((request): RequesterRequestDetail[] => {
        const detail = this.repositories.requestRepository.get(request.id);
        return detail ? [redactRequestSecrets(detail)] : [];
      });
    const variableSets = this.repositories.variableSetRepository.list(workspaceId).map((set) => ({
      ...set,
      variables: this.repositories.variableSetRepository.listVariables(set.id)
    }));
    const history = this.repositories.historyRepository
      .list(workspaceId)
      .flatMap((entry) => {
        const detail = this.repositories.historyRepository.get(entry.id);
        return detail ? [detail] : [];
      })
      .map((entry) => ({
        ...entry,
        requestSnapshot: redactRequestSecrets(entry.requestSnapshot)
      }));

    const backup: RequesterWorkspaceBackup = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      workspace,
      settings: redactSettingsSecrets(
        this.repositories.workspaceRepository.getSettings(workspaceId)
      ),
      requests,
      variableSets,
      cookies: this.repositories.cookieRepository.list(workspaceId),
      history
    };

    await fs.writeFile(filePath, JSON.stringify(backup, null, 2), 'utf-8');
  }

  async importWorkspaceFromFile(filePath: string): Promise<string> {
    const backup = JSON.parse(await fs.readFile(filePath, 'utf-8')) as RequesterWorkspaceBackup;
    if (backup.schemaVersion !== 1) {
      throw new Error(`Unsupported requester backup schema: ${backup.schemaVersion}`);
    }

    const workspace = this.repositories.workspaceRepository.create(
      `${backup.workspace.name} Import`
    );
    this.repositories.workspaceRepository.saveSettings(
      workspace.id,
      normalizeRequesterWorkspaceSettings(redactSettingsSecrets(backup.settings))
    );

    const requestIdMap = new Map<string, string>();
    for (const request of backup.requests) {
      const saved = this.repositories.requestRepository.save({
        ...redactRequestSecrets(request),
        id: undefined,
        workspaceId: workspace.id
      });
      requestIdMap.set(request.id, saved.id);
    }

    for (const variableSet of backup.variableSets) {
      const saved = this.repositories.variableSetRepository.save({
        workspaceId: workspace.id,
        name: variableSet.name
      });
      this.repositories.variableSetRepository.upsertVariables(saved.id, variableSet.variables);
    }

    for (const cookie of backup.cookies) {
      this.repositories.cookieRepository.importCookie(workspace.id, {
        ...cookie,
        id: '',
        workspaceId: workspace.id
      });
    }

    for (const entry of backup.history) {
      const requestSnapshot = redactRequestSecrets(entry.requestSnapshot);
      const oldRequestId = requestSnapshot.id;
      this.repositories.historyRepository.saveExecution({
        startedAt: entry.startedAt,
        request: {
          ...requestSnapshot,
          id: oldRequestId ? requestIdMap.get(oldRequestId) : undefined,
          workspaceId: workspace.id
        },
        response: entry.responseSnapshot
      });
    }

    return workspace.id;
  }
}

const redactSettingsSecrets = (
  settings: RequesterWorkspaceBackup['settings']
): RequesterWorkspaceBackup['settings'] => ({
  ...settings,
  proxyPasswordSecretId: undefined,
  clientCertificatePassphraseSecretId: undefined
});

const redactRequestSecrets = <T extends SaveRequesterRequestInput>(request: T): T => ({
  ...request,
  proxyPasswordSecretId: undefined,
  clientCertificatePassphraseSecretId: undefined
});
