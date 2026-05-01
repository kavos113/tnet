import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TasksDefaultView, TasksGlobalSettings } from '@tnet/app-tasks/shared/config';
import { defaultTasksGlobalSettings } from '@tnet/app-tasks/shared/config';
import type {
  CalendarEventOccurrence,
  CalendarSource,
  TaskItem
} from '@tnet/app-tasks/shared/tasksTypes';
import { toLocalDateString } from '@tnet/app-tasks/shared/dateHelpers';

interface TasksState {
  tasks: TaskItem[];
  categories: string[];
  calendarSources: CalendarSource[];
  calendarOccurrences: CalendarEventOccurrence[];
  settings: TasksGlobalSettings;
  categoryFilter?: string;
  currentDate: string;
  view: TasksDefaultView;
  isRestored: boolean;
  error?: string;
}

const defaultSettings = defaultTasksGlobalSettings();

const initialState: TasksState = {
  tasks: [],
  categories: [],
  calendarSources: [],
  calendarOccurrences: [],
  settings: defaultSettings,
  currentDate: toLocalDateString(),
  view: defaultSettings.defaultView,
  isRestored: false
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    restoreTasks: (
      state,
      action: PayloadAction<{
        tasks?: TaskItem[];
        categories?: string[];
        calendarSources?: CalendarSource[];
        calendarOccurrences?: CalendarEventOccurrence[];
        settings?: TasksGlobalSettings;
      }>
    ) => {
      state.tasks = action.payload.tasks ?? [];
      state.categories = action.payload.categories ?? [];
      state.calendarSources = action.payload.calendarSources ?? [];
      state.calendarOccurrences = action.payload.calendarOccurrences ?? [];
      state.settings = action.payload.settings ?? defaultTasksGlobalSettings();
      state.view = state.settings.defaultView;
      state.isRestored = true;
    },
    setTasks: (state, action: PayloadAction<TaskItem[]>) => {
      state.tasks = action.payload;
    },
    upsertTask: (state, action: PayloadAction<TaskItem>) => {
      const index = state.tasks.findIndex((task) => task.id === action.payload.id);
      if (index >= 0) {
        state.tasks[index] = action.payload;
      } else {
        state.tasks.push(action.payload);
      }
    },
    removeTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter((task) => task.id !== action.payload);
    },
    setTaskCategories: (state, action: PayloadAction<string[]>) => {
      state.categories = action.payload;
    },
    setTasksCalendarSources: (state, action: PayloadAction<CalendarSource[]>) => {
      state.calendarSources = action.payload;
    },
    setTasksCalendarOccurrences: (state, action: PayloadAction<CalendarEventOccurrence[]>) => {
      state.calendarOccurrences = action.payload;
    },
    setTasksSettings: (state, action: PayloadAction<TasksGlobalSettings>) => {
      state.settings = action.payload;
      state.view = action.payload.defaultView;
    },
    setTasksCategoryFilter: (state, action: PayloadAction<string | undefined>) => {
      state.categoryFilter = action.payload;
    },
    setTasksCurrentDate: (state, action: PayloadAction<string>) => {
      state.currentDate = action.payload;
    },
    setTasksView: (state, action: PayloadAction<TasksDefaultView>) => {
      state.view = action.payload;
    },
    setTasksError: (state, action: PayloadAction<string | undefined>) => {
      state.error = action.payload;
    }
  }
});

export const {
  removeTask,
  restoreTasks,
  setTaskCategories,
  setTasks,
  setTasksCalendarOccurrences,
  setTasksCalendarSources,
  setTasksCategoryFilter,
  setTasksCurrentDate,
  setTasksError,
  setTasksSettings,
  setTasksView,
  upsertTask
} = tasksSlice.actions;

export default tasksSlice.reducer;
