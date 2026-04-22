export const ipcChannels = {
  workspace: {
    openDirectory: 'workspace:openDirectory',
    getFileTree: 'workspace:getFileTree'
  },
  file: {
    read: 'file:read',
    write: 'file:write',
    create: 'file:create',
    createDirectory: 'file:createDirectory',
    delete: 'file:delete',
    rename: 'file:rename'
  },
  session: {
    load: 'session:load',
    save: 'session:save'
  },
  config: {
    loadGlobal: 'config:loadGlobal',
    saveGlobal: 'config:saveGlobal',
    loadProject: 'config:loadProject',
    saveProject: 'config:saveProject'
  },
  keyword: {
    loadIndex: 'keyword:loadIndex',
    getContent: 'keyword:getContent'
  },
  llm: {
    getInlineCompletion: 'llm:getInlineCompletion'
  }
} as const;
