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
      remove: (request) => getApi().tasks.calendarSources.remove(request)
    },
    calendarOccurrences: {
      list: (request) => getApi().tasks.calendarOccurrences.list(request)
    },
    sync: {
      manual: (request) => getApi().tasks.sync.manual(request),
      writeTask: (request) => getApi().tasks.sync.writeTask(request)
    },
    secrets: {
      has: (request) => getApi().tasks.secrets.has(request)
    }
  }
};
