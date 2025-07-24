const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  updateBackendUrl: (url) => ipcRenderer.send('update-backend-url', url),
  onBackendUrlUpdated: (callback) => ipcRenderer.on('backend-url-updated', (_, data) => callback(data)),
  getBackendUrl: () => ipcRenderer.invoke('get-backend-url') // Pega a URL salva
});

