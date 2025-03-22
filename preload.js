const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (path) => ipcRenderer.invoke('read-file', path),
  saveFile: (content) => ipcRenderer.invoke('save-file', content),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  saveConfig: (config) => ipcRenderer.send('save-config', config),
  getConfig: () => ipcRenderer.invoke('get-config'),
  onLoadHistory: (callback) => ipcRenderer.on('load-history', callback)
})