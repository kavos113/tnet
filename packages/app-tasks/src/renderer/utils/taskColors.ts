import type { CSSProperties } from 'react';
import type {
  CalendarEventOccurrence,
  CalendarSource,
  SubscribedTaskOccurrence,
  TaskItem
} from '@tnet/app-tasks/shared/tasksTypes';

export type SourceColorMap = Record<string, string>;
export type CategoryColorMap = Record<string, string>;

export const buildSourceColorMap = (sources: CalendarSource[]): SourceColorMap =>
  sources.reduce<SourceColorMap>((colors, source) => {
    if (source.color) colors[source.id] = source.color;
    return colors;
  }, {});

export const getTaskAccentColor = (
  task: TaskItem,
  categoryColors: CategoryColorMap,
  sourceColors: SourceColorMap = {}
): string | undefined => {
  if (task.id.startsWith('subscribed:') && task.sourceUrl) return sourceColors[task.sourceUrl];
  return task.category ? categoryColors[task.category] : undefined;
};

export const getSubscribedTaskAccentColor = (
  task: SubscribedTaskOccurrence,
  sourceColors: SourceColorMap
): string | undefined => sourceColors[task.sourceId];

export const getSubscribedEventAccentColor = (
  event: CalendarEventOccurrence,
  sourceColors: SourceColorMap
): string | undefined => sourceColors[event.sourceId];

export const accentColorStyle = (color: string | undefined): CSSProperties | undefined =>
  color ? ({ '--task-accent-color': color } as CSSProperties) : undefined;
