const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Service Key Management
  loadServiceKeyFile: () => ipcRenderer.invoke('load-service-key-file'),
  saveServiceKey: (serviceKey) => ipcRenderer.invoke('save-service-key', serviceKey),
  getServiceKey: () => ipcRenderer.invoke('get-service-key'),
  clearServiceKey: () => ipcRenderer.invoke('clear-service-key'),
  getAuthConfig: () => ipcRenderer.invoke('get-auth-config'),

  // CPI Service Key Management
  loadCpiServiceKeyFile: () => ipcRenderer.invoke('load-cpi-service-key-file'),
  saveCpiServiceKey: (payload) => ipcRenderer.invoke('save-cpi-service-key', payload),
  getCpiServiceKey: () => ipcRenderer.invoke('get-cpi-service-key'),
  clearCpiServiceKey: () => ipcRenderer.invoke('clear-cpi-service-key'),
  getCpiAuthConfig: () => ipcRenderer.invoke('get-cpi-auth-config'),
  testCpiConnection: () => ipcRenderer.invoke('test-cpi-connection'),
  activateCpiArchiving: () => ipcRenderer.invoke('activate-cpi-archiving'),

  // API Calls (via main process to avoid CORS)
  testConnection: () => ipcRenderer.invoke('test-connection'),
  requestToken: () => ipcRenderer.invoke('request-token'),
  apiRequest: (options) => ipcRenderer.invoke('api-request', options),
  apiUpload: (options) => ipcRenderer.invoke('api-upload', options),

  // File Operations
  selectFileForUpload: () => ipcRenderer.invoke('select-file-for-upload'),
  saveDownloadedFile: (fileName, data) => ipcRenderer.invoke('save-downloaded-file', { fileName, data }),

  // Logs
  saveLog: (logEntry) => ipcRenderer.invoke('save-log', logEntry),
  getLogs: (options) => ipcRenderer.invoke('get-logs', options),
  clearLogs: () => ipcRenderer.invoke('clear-logs'),
  onLogAdded: (callback) => {
    ipcRenderer.on('log-added', (event, log) => callback(log))
  },

  // Settings
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
})
