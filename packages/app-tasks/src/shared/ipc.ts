import type { TasksGlobalConfig } from './config';
import type {
  CalendarEventOccurrence,
  CalendarSource,
  ListCalendarOccurrencesRequest,
  ListLocalEventsRequest,
  ListSubscribedTaskOccurrencesRequest,
  ListTasksRequest,
  LocalEvent,
  SaveCalendarSourceInput,
  SaveLocalEventInput,
  SaveTaskInput,
  SubscribedTaskOccurrence,
  TaskItem
} from './tasksTypes';

export const tasksIpcChannels = {
  config: {
    loadGlobal: 'tasks:config:loadGlobal',
    saveGlobal: 'tasks:config:saveGlobal'
  },
  tasks: {
    list: 'tasks:tasks:list',
    save: 'tasks:tasks:save',
    complete: 'tasks:tasks:complete',
    remove: 'tasks:tasks:remove'
  },
  categories: {
    list: 'tasks:categories:list'
  },
  calendarSources: {
    list: 'tasks:calendarSources:list',
    save: 'tasks:calendarSources:save',
    remove: 'tasks:calendarSources:remove'
  },
  calendarOccurrences: {
    list: 'tasks:calendarOccurrences:list'
  },
  subscribedTaskOccurrences: {
    list: 'tasks:subscribedTaskOccurrences:list'
  },
  localEvents: {
    list: 'tasks:localEvents:list',
    save: 'tasks:localEvents:save',
    remove: 'tasks:localEvents:remove'
  },
  sync: {
    manual: 'tasks:sync:manual',
    writeTask: 'tasks:sync:writeTask'
  },
  secrets: {
    has: 'tasks:secrets:has'
  }
} as const;

export interface TasksApi {
  tasks: {
    config: {
      loadGlobal: () => Promise<TasksGlobalConfig>;
      saveGlobal: (config: TasksGlobalConfig) => Promise<void>;
    };
    tasks: {
      list: (request?: ListTasksRequest) => Promise<TaskItem[]>;
      save: (request: SaveTaskInput) => Promise<TaskItem>;
      complete: (request: { taskId: string; completed: boolean }) => Promise<TaskItem>;
      remove: (request: { taskId: string }) => Promise<void>;
    };
    categories: {
      list: () => Promise<string[]>;
    };
    calendarSources: {
      list: () => Promise<CalendarSource[]>;
      save: (request: SaveCalendarSourceInput) => Promise<CalendarSource>;
      remove: (request: { sourceId: string }) => Promise<void>;
    };
    calendarOccurrences: {
      list: (request: ListCalendarOccurrencesRequest) => Promise<CalendarEventOccurrence[]>;
    };
    subscribedTaskOccurrences: {
      list: (request: ListSubscribedTaskOccurrencesRequest) => Promise<SubscribedTaskOccurrence[]>;
    };
    localEvents: {
      list: (request: ListLocalEventsRequest) => Promise<LocalEvent[]>;
      save: (request: SaveLocalEventInput) => Promise<LocalEvent>;
      remove: (request: { eventId: string }) => Promise<void>;
    };
    sync: {
      manual: (request?: { sourceId?: string }) => Promise<{
        sources: CalendarSource[];
        syncedSourceIds: string[];
        failedSourceIds: string[];
      }>;
    };
    secrets: {
      has: (request: { secretId?: string }) => Promise<{ exists: boolean }>;
    };
  };
}
