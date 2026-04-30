import { describe, expect, it } from 'vitest';
import {
  buildRequesterExplorerTree,
  normalizeRequestPath,
  requestNameFromPath
} from './requestPath';

describe('requestPath', () => {
  it('normalizes request paths', () => {
    const testcases: Array<{ input: string; want: string }> = [
      { input: 'health', want: 'health.req' },
      { input: ' users\\list ', want: 'users/list.req' },
      { input: 'users/create.req', want: 'users/create.req' },
      { input: '', want: 'untitled.req' }
    ];

    for (const testcase of testcases) {
      expect(normalizeRequestPath(testcase.input)).toBe(testcase.want);
    }
  });

  it('derives display names from request paths', () => {
    expect(requestNameFromPath('users/list.req')).toBe('list');
    expect(requestNameFromPath('health')).toBe('health');
  });

  it('builds a future explorer tree from request paths', () => {
    expect(
      buildRequesterExplorerTree([
        { name: 'Health', requestPath: 'health.req' },
        { name: 'List Users', requestPath: 'users/list.req' }
      ])
    ).toEqual([
      {
        name: 'users',
        path: 'users',
        isDirectory: true,
        children: [
          {
            name: 'List Users',
            path: 'users/list.req',
            isDirectory: false,
            children: undefined
          }
        ]
      },
      {
        name: 'Health',
        path: 'health.req',
        isDirectory: false,
        children: undefined
      }
    ]);
  });
});
