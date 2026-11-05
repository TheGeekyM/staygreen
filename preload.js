const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  start: (range) => ipcRenderer.send('start', range),
  stop: () => ipcRenderer.send('stop'),
  idle: () => ipcRenderer.invoke('idle'),
  onStatus: (fn) => ipcRenderer.on('status', (_, s) => fn(s)),
});
