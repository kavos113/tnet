import type { RequesterWorkspaceSettings } from './config';
import type {
  RequesterCookie,
  RequesterHistoryDetail,
  RequesterRequestDetail,
  RequesterVariable,
  RequesterVariableSet,
  RequesterWorkspace
} from './requesterTypes';

export interface RequesterVariableSetBackup extends RequesterVariableSet {
  variables: RequesterVariable[];
}

export interface RequesterWorkspaceBackup {
  schemaVersion: 1;
  exportedAt: string;
  workspace: RequesterWorkspace;
  settings: RequesterWorkspaceSettings;
  requests: RequesterRequestDetail[];
  variableSets: RequesterVariableSetBackup[];
  cookies: RequesterCookie[];
  history: RequesterHistoryDetail[];
}
