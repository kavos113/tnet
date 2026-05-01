import type { TasksGlobalConfig } from './config';
import type {
  CalendarEventOccurrence,
  CalendarSource,
  ListCalendarOccurrencesRequest,
  ListTasksRequest,
  SaveCalendarSourceInput,
  SaveTaskInput,
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
  };
}
