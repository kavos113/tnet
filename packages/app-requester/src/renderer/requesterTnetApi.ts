import { getTnetApi } from '@tnet/renderer-core/tnetApi';
import type { TnetApi } from '@tnet/shared/ipc/contracts';
import type { RequesterApi } from '@tnet/app-requester/shared/ipc';

const getApi = (): TnetApi & RequesterApi => getTnetApi<TnetApi & RequesterApi>();

export const requesterTnetApi: RequesterApi = {
  requester: {
    config: {
      loadGlobal: () => getApi().requester.config.loadGlobal(),
      saveGlobal: (config) => getApi().requester.config.saveGlobal(config)
    },
    workspaces: {
      list: () => getApi().requester.workspaces.list(),
      create: (request) => getApi().requester.workspaces.create(request),
      update: (request) => getApi().requester.workspaces.update(request),
      remove: (request) => getApi().requester.workspaces.remove(request),
      getSettings: (request) => getApi().requester.workspaces.getSettings(request),
      saveSettings: (request) => getApi().requester.workspaces.saveSettings(request)
    },
    requests: {
      list: (request) => getApi().requester.requests.list(request)
    }
  }
};
