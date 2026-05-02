import { useEffect, useState } from 'react';
import { addLocalDays, toLocalDateString } from '@tnet/app-tasks/shared/dateHelpers';
import type { TasksDefaultView } from '@tnet/app-tasks/shared/config';
import { emptyLocalEventDraft, type LocalEventDraft } from '../state/localEventDraft';
import { emptyTaskDraft, type TaskDraft } from '../state/tasksDraft';
import type { TasksDetailsPanelState } from '../state/tasksDetailsState';
import type { QuickAddKind } from '../components/forms/TasksQuickAddForm';

export const useTasksUiState = (currentDate: string, view: TasksDefaultView) => {
  const [clock, setClock] = useState(() => new Date());
  const [draft, setDraft] = useState<TaskDraft>(emptyTaskDraft);
  const [quickAddKind, setQuickAddKind] = useState<QuickAddKind>('task');
  const [quickEventDraft, setQuickEventDraft] = useState<LocalEventDraft>(() =>
    emptyLocalEventDraft(currentDate)
  );
  const [detailsPanel, setDetailsPanel] = useState<TasksDetailsPanelState>();
  const [selectedQuickDate, setSelectedQuickDate] = useState<string>(currentDate);
  const [eventDraft, setEventDraft] = useState<LocalEventDraft>();
  const [calendarFocusDate, setCalendarFocusDate] = useState<string>(currentDate);

  useEffect(() => {
    const intervalId = window.setInterval(() => setClock(new Date()), 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  const setQuickInputDate = (date: string): void => {
    setSelectedQuickDate(date);
    setDraft((current) => ({ ...current, deadlineDate: date }));
    setQuickEventDraft((current) => ({ ...current, date }));
  };

  const moveCalendarRange = (days: number): void => {
    setCalendarFocusDate((date) =>
      view === 'month' ? addLocalMonths(date, days > 0 ? 1 : -1) : addLocalDays(date, days)
    );
  };

  return {
    calendarFocusDate,
    clock,
    detailsPanel,
    draft,
    eventDraft,
    moveCalendarRange,
    quickAddKind,
    quickEventDraft,
    selectedQuickDate,
    setCalendarFocusDate,
    setDetailsPanel,
    setDraft,
    setEventDraft,
    setQuickAddKind,
    setQuickEventDraft,
    setQuickInputDate
  };
};

const addLocalMonths = (date: string, months: number): string => {
  const parsed = new Date(`${date.slice(0, 7)}-01T00:00:00`);
  parsed.setMonth(parsed.getMonth() + months);
  return toLocalDateString(parsed);
};
