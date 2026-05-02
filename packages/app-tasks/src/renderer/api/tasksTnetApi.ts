import { getTnetApi } from '@tnet/renderer-core/tnetApi';
import type { TnetApi } from '@tnet/shared/ipc/contracts';
import type { TasksApi } from '@tnet/app-tasks/shared/ipc';

const getApi = (): TnetApi & TasksApi => getTnetApi<TnetApi & TasksApi>();

export const tasksTnetApi: TasksApi = {
  tasks: {
    config: {
      loadGlobal: () => getApi().tasks.config.loadGlobal(),
      saveGlobal: (config) => getApi().tasks.config.saveGlobal(config)
    },
    tasks: {
      list: (request) => getApi().tasks.tasks.list(request),
      save: (request) => getApi().tasks.tasks.save(request),
      complete: (request) => getApi().tasks.tasks.complete(request),
      remove: (request) => getApi().tasks.tasks.remove(request)
    },
    categories: {
      list: () => getApi().tasks.categories.list()
    },
    calendarSources: {
      list: () => getApi().tasks.calendarSources.list(),
      save: (request) => getApi().tasks.calendarSources.save(request),
      remove: (request) => getApi().tasks.calendarSources.remove(request),
      authorizeGoogle: (request) => getApi().tasks.calendarSources.authorizeGoogle(request)
    },
    calendarOccurrences: {
      list: (request) => getApi().tasks.calendarOccurrences.list(request)
    },
    subscribedTaskOccurrences: {
      list: (request) => getApi().tasks.subscribedTaskOccurrences.list(request),
      complete: (request) => getApi().tasks.subscribedTaskOccurrences.complete(request)
    },
    localEvents: {
      list: (request) => getApi().tasks.localEvents.list(request),
      save: (request) => getApi().tasks.localEvents.save(request),
      remove: (request) => getApi().tasks.localEvents.remove(request)
    },
    sync: {
      manual: (request) => getApi().tasks.sync.manual(request)
    },
    secrets: {
      has: (request) => getApi().tasks.secrets.has(request)
    }
  }
};
