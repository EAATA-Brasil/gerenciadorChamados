const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 🔗 Backend URL
  updateBackendUrl: (url) => ipcRenderer.send('update-backend-url', url),
  onBackendUrlUpdated: (callback) => ipcRenderer.on('backend-url-updated', (_, data) => callback(data)),
  getBackendUrl: () => ipcRenderer.invoke('get-backend-url'),

  // 🔔 Notificações
  getNotificationPreference: () => ipcRenderer.invoke('get-notification-preference'),
  setNotificationPreference: (enabled) => ipcRenderer.send('set-notification-preference', enabled)
});
