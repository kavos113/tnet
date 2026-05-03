import type { TaskItem } from '@tnet/app-tasks/shared/tasksTypes';
import { LocalEventEditor } from './LocalEventEditor';
import { TasksDetailsPanel } from './TasksDetailsPanel';
import { type QuickAddKind } from '../forms/TasksQuickAddForm';
import { TaskDetailsForm } from './TaskDetailsForm';
import { localEventDraftFromEvent, type LocalEventDraft } from '../../state/localEventDraft';
import { emptyTaskDraft, type TaskDraft } from '../../state/tasksDraft';
import {
  createTaskEditHandler,
  eventDraftFromTaskDraft,
  getDetailsPanelTitle,
  taskDraftFromEventDraft,
  type TasksDetailsPanelState
} from '../../state/tasksDetailsState';
import styles from './TasksDetailsKind.module.css';

export interface TasksEditableDetailsPaneProps {
  calendarTasks: TaskItem[];
  categories: string[];
  categoryColors: Record<string, string>;
  detailsPanel: TasksDetailsPanelState;
  draft: TaskDraft;
  eventDraft?: LocalEventDraft;
  isCategoryCompletionEnabled: boolean;
  selectedQuickDate: string;
  sourceColors: Record<string, string>;
  sourceNames: Record<string, string>;
  tasks: TaskItem[];
  onClose: () => void;
  onDeleteEvent: (eventId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onDraftChange: (draft: TaskDraft) => void;
  onEventDraftChange: (draft: LocalEventDraft | undefined) => void;
  onPanelChange: (state: TasksDetailsPanelState | undefined) => void;
  onSaveEvent: () => void;
  onSaveTask: () => void;
}

export const TasksEditableDetailsPane = ({
  calendarTasks,
  categories,
  categoryColors,
  detailsPanel,
  draft,
  eventDraft,
  isCategoryCompletionEnabled,
  selectedQuickDate,
  sourceColors,
  sourceNames,
  tasks,
  onClose,
  onDeleteEvent,
  onDeleteTask,
  onDraftChange,
  onEventDraftChange,
  onPanelChange,
  onSaveEvent,
  onSaveTask
}: TasksEditableDetailsPaneProps): React.JSX.Element => (
  <TasksDetailsPanel
    title={getDetailsPanelTitle(detailsPanel)}
    readOnlyItem={getReadOnlyItem({
      detailsPanel,
      tasks,
      calendarTasks,
      onDraftChange,
      onEventDraftChange,
      onPanelChange,
      categoryColors,
      sourceColors,
      sourceNames
    })}
    onClose={onClose}
  >
    {detailsPanel.type === 'task' ? (
      <>
        <DetailsKindSelect
          value="task"
          onChange={(kind) => {
            if (kind === 'event') {
              onEventDraftChange(eventDraftFromTaskDraft(draft, selectedQuickDate));
              onPanelChange({ type: 'event' });
            }
          }}
        />
        <TaskDetailsForm
          categories={categories}
          categoryColor={draft.category ? categoryColors[draft.category] : undefined}
          draft={draft}
          isCategoryCompletionEnabled={isCategoryCompletionEnabled}
          onCancel={() => {
            onDraftChange(emptyTaskDraft());
            onPanelChange(undefined);
          }}
          onChange={onDraftChange}
          onDelete={draft.id ? () => onDeleteTask(draft.id as string) : undefined}
          onSave={onSaveTask}
        />
      </>
    ) : null}
    {detailsPanel.type === 'event' && eventDraft ? (
      <>
        <DetailsKindSelect
          value="event"
          onChange={(kind) => {
            if (kind === 'task') {
              onDraftChange(taskDraftFromEventDraft(eventDraft));
              onPanelChange({ type: 'task' });
            }
          }}
        />
        <LocalEventEditor
          draft={eventDraft}
          onCancel={() => {
            onEventDraftChange(undefined);
            onPanelChange(undefined);
          }}
          onChange={onEventDraftChange}
          onDelete={eventDraft.id ? () => onDeleteEvent(eventDraft.id as string) : undefined}
          onSave={onSaveEvent}
        />
      </>
    ) : null}
  </TasksDetailsPanel>
);

const getReadOnlyItem = ({
  detailsPanel,
  tasks,
  calendarTasks,
  onDraftChange,
  onEventDraftChange,
  onPanelChange,
  categoryColors,
  sourceColors,
  sourceNames
}: {
  detailsPanel: TasksDetailsPanelState;
  tasks: TaskItem[];
  calendarTasks: TaskItem[];
  onDraftChange: (draft: TaskDraft) => void;
  onEventDraftChange: (draft: LocalEventDraft | undefined) => void;
  onPanelChange: (state: TasksDetailsPanelState | undefined) => void;
  categoryColors: Record<string, string>;
  sourceColors: Record<string, string>;
  sourceNames: Record<string, string>;
}): React.ComponentProps<typeof TasksDetailsPanel>['readOnlyItem'] => {
  if (detailsPanel.type === 'task-detail') {
    return {
      type: 'task',
      task: detailsPanel.task,
      accentColor: detailsPanel.task.category
        ? categoryColors[detailsPanel.task.category]
        : undefined,
      sourceName: detailsPanel.task.sourceUrl
        ? sourceNames[detailsPanel.task.sourceUrl]
        : undefined,
      onEdit: createTaskEditHandler(
        detailsPanel.task,
        tasks,
        calendarTasks,
        onDraftChange,
        onPanelChange
      )
    };
  }
  if (detailsPanel.type === 'event-detail') {
    return {
      type: 'event',
      event: detailsPanel.event,
      onEdit: () => {
        onEventDraftChange(localEventDraftFromEvent(detailsPanel.event));
        onPanelChange({ type: 'event' });
      }
    };
  }
  if (detailsPanel.type === 'subscription-event') {
    return {
      ...detailsPanel,
      accentColor: sourceColors[detailsPanel.event.sourceId],
      sourceName: sourceNames[detailsPanel.event.sourceId]
    };
  }
  if (detailsPanel.type === 'subscription-task') {
    return {
      ...detailsPanel,
      accentColor: sourceColors[detailsPanel.task.sourceId],
      sourceName: sourceNames[detailsPanel.task.sourceId]
    };
  }
  return undefined;
};

const DetailsKindSelect = ({
  value,
  onChange
}: {
  value: QuickAddKind;
  onChange: (kind: QuickAddKind) => void;
}): React.JSX.Element => (
  <label className={styles.detailsKind}>
    Type
    <select
      aria-label="Detail item type"
      value={value}
      onChange={(event) => onChange(event.target.value as QuickAddKind)}
    >
      <option value="task">Task</option>
      <option value="event">Event</option>
    </select>
  </label>
);
