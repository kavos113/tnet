import { describe, expect, it } from 'vitest';
import {
  buildRequesterExplorerTree,
  requestDisplayNameFromPath,
  requestFolderFromPath,
  normalizeRequestPath,
  requestNameFromPath
} from './requestPath';

describe('requestPath', () => {
  it('normalizes request paths', () => {
    const testcases: Array<{ input: string; want: string }> = [
      { input: 'health', want: 'health.http' },
      { input: ' users\\list ', want: 'users/list.http' },
      { input: 'users/create.http', want: 'users/create.http' },
      { input: 'legacy/request.req', want: 'legacy/request.http' },
      { input: '', want: 'untitled.http' }
    ];

    for (const testcase of testcases) {
      expect(normalizeRequestPath(testcase.input)).toBe(testcase.want);
    }
  });

  it('derives display names from request paths', () => {
    expect(requestNameFromPath('users/list.http')).toBe('list');
    expect(requestNameFromPath('users/list.req')).toBe('list');
    expect(requestDisplayNameFromPath('users/list')).toBe('list.http');
    expect(requestFolderFromPath('users/admin/list.http')).toBe('users/admin');
    expect(requestFolderFromPath('health.http')).toBeUndefined();
    expect(requestNameFromPath('health')).toBe('health');
  });

  it('builds an explorer tree from request paths', () => {
    expect(
      buildRequesterExplorerTree([
        { id: 'health', name: 'Health', method: 'GET', requestPath: 'health.http' },
        { id: 'list-users', name: 'List Users', method: 'POST', requestPath: 'users/list.http' }
      ])
    ).toEqual([
      {
        name: 'users',
        path: 'users',
        isDirectory: true,
        children: [
          {
            name: 'list.http',
            path: 'users/list.http',
            isDirectory: false,
            requestId: 'list-users',
            method: 'POST',
            children: undefined
          }
        ]
      },
      {
        name: 'health.http',
        path: 'health.http',
        isDirectory: false,
        requestId: 'health',
        method: 'GET',
        children: undefined
      }
    ]);
  });

  it('sorts folders before requests and names within each folder', () => {
    expect(
      buildRequesterExplorerTree([
        { id: 'z-root', name: 'Z Root', method: 'GET', requestPath: 'z-root.http' },
        {
          id: 'admin-health',
          name: 'Admin Health',
          method: 'GET',
          requestPath: 'admin/health.http'
        },
        { id: 'admin-list', name: 'Admin List', method: 'GET', requestPath: 'admin/list.http' },
        {
          id: 'accounts-list',
          name: 'Accounts List',
          method: 'GET',
          requestPath: 'accounts/list.http'
        },
        { id: 'a-root', name: 'A Root', method: 'GET', requestPath: 'a-root.http' }
      ]).map((node) => node.path)
    ).toEqual(['accounts', 'admin', 'a-root.http', 'z-root.http']);
  });

  it('keeps same-name folders and requests distinct', () => {
    expect(
      buildRequesterExplorerTree([
        { id: 'folder-request', name: 'Users request', method: 'GET', requestPath: 'users.http' },
        { id: 'nested-request', name: 'Users list', method: 'GET', requestPath: 'users/list.http' }
      ])
    ).toEqual([
      {
        name: 'users',
        path: 'users',
        isDirectory: true,
        children: [
          {
            name: 'list.http',
            path: 'users/list.http',
            isDirectory: false,
            requestId: 'nested-request',
            method: 'GET',
            children: undefined
          }
        ]
      },
      {
        name: 'users.http',
        path: 'users.http',
        isDirectory: false,
        requestId: 'folder-request',
        method: 'GET',
        children: undefined
      }
    ]);
  });
});
