import { describe, expect, it } from 'vitest';
import {
  defaultTasksGlobalSettings,
  getTasksGlobalSettings,
  normalizeTasksGlobalSettings,
  withTasksGlobalSettings
} from './config';

describe('Tasks config', () => {
  it('normalizes settings and clamps sync intervals', () => {
    const testCases = [
      {
        name: 'valid values',
        input: {
          weekStartsOn: 0,
          timeFormat: '12h',
          defaultView: 'month',
          clockSize: 'compact',
          completedTaskScope: 'today',
          syncIntervalMinutes: 15,
          showPortal: false,
          categoryCompletionEnabled: false
        },
        expected: {
          weekStartsOn: 0,
          timeFormat: '12h',
          defaultView: 'month',
          clockSize: 'compact',
          completedTaskScope: 'today',
          syncIntervalMinutes: 15,
          showPortal: false,
          categoryCompletionEnabled: false
        }
      },
      {
        name: 'invalid values',
        input: {
          weekStartsOn: 9,
          timeFormat: 'bad',
          defaultView: 'agenda',
          clockSize: 'huge',
          completedTaskScope: 'week',
          syncIntervalMinutes: -1
        },
        expected: defaultTasksGlobalSettings()
      },
      {
        name: 'interval bounds',
        input: {
          syncIntervalMinutes: 2
        },
        expected: {
          ...defaultTasksGlobalSettings(),
          syncIntervalMinutes: 5
        }
      }
    ] as const;

    for (const testCase of testCases) {
      expect(normalizeTasksGlobalSettings(testCase.input as never), testCase.name).toEqual(
        testCase.expected
      );
    }
  });

  it('reads and writes tasks settings inside the root global config', () => {
    const config = withTasksGlobalSettings(
      {
        activeAppId: 'tasks',
        apps: {
          markdown: {}
        }
      },
      {
        defaultView: 'today',
        syncIntervalMinutes: 30
      }
    );

    expect(getTasksGlobalSettings(config)).toMatchObject({
      defaultView: 'today',
      syncIntervalMinutes: 30
    });
    expect(config.apps?.tasks).toBeTruthy();
  });
});
