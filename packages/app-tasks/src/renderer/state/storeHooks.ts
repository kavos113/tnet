import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { UnknownAction } from '@reduxjs/toolkit';
import type tasksReducer from './tasksSlice';

export interface TasksRootState {
  tasks: ReturnType<typeof tasksReducer>;
}

export const useTasksDispatch = (): ((action: UnknownAction) => unknown) => useDispatch();
export const useTasksSelector: TypedUseSelectorHook<TasksRootState> = useSelector;
