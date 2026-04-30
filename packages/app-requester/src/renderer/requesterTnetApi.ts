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
      list: (request) => getApi().requester.requests.list(request),
      get: (request) => getApi().requester.requests.get(request),
      save: (request) => getApi().requester.requests.save(request),
      duplicate: (request) => getApi().requester.requests.duplicate(request),
      rename: (request) => getApi().requester.requests.rename(request),
      reorder: (request) => getApi().requester.requests.reorder(request),
      remove: (request) => getApi().requester.requests.remove(request)
    },
    variableSets: {
      list: (request) => getApi().requester.variableSets.list(request),
      save: (request) => getApi().requester.variableSets.save(request),
      remove: (request) => getApi().requester.variableSets.remove(request),
      setActive: (request) => getApi().requester.variableSets.setActive(request)
    }
  }
};
