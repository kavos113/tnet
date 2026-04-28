export const ipcChannels = {
  workspace: {
    openDirectory: 'workspace:openDirectory',
    getFileTree: 'workspace:getFileTree'
  },
  file: {
    read: 'file:read',
    openWithDefaultApp: 'file:openWithDefaultApp',
    write: 'file:write',
    saveImage: 'file:saveImage',
    readImage: 'file:readImage',
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
  search: {
    rebuild: 'search:rebuild',
    workspace: 'search:workspace'
  },
  llm: {
    getInlineCompletion: 'llm:getInlineCompletion'
  }
} as const;
