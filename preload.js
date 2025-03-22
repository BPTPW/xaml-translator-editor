const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (path) => ipcRenderer.invoke('read-file', path),
  saveFile: (content) => ipcRenderer.invoke('save-file', content),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options)
})