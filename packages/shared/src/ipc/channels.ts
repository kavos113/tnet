export const ipcChannels = {
  workspace: {
    openDirectory: 'workspace:openDirectory',
    getFileTree: 'workspace:getFileTree'
  },
  file: {
    read: 'file:read',
    openWithDefaultApp: 'file:openWithDefaultApp',
    createDirectory: 'file:createDirectory',
    rename: 'file:rename',
    move: 'file:move'
  },
  session: {
    load: 'session:load',
    save: 'session:save'
  },
  config: {
    loadGlobal: 'config:loadGlobal',
    saveGlobal: 'config:saveGlobal'
  }
} as const;
