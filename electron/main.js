const { app, BrowserWindow, ipcMain, dialog, safeStorage, session, nativeImage } = require('electron')
const path = require('path')
const Store = require('electron-store')
const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')

// Initialize secure store
const store = new Store({
  name: 'dms-client-config',
  encryptionKey: 'dms-client-secure-key-2024',
})

let mainWindow

// Token management
let accessToken = null
let tokenExpiry = null
let serviceKey = null

// CPI Token management
let cpiAccessToken = null
let cpiTokenExpiry = null
let cpiServiceKey = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#121212',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
    icon: path.join(__dirname, '../resources/icon.png'),
    titleBarStyle: 'hiddenInset',
    show: false,
  })

  // Load the app
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
}

app.whenReady().then(() => {
  // Set macOS dock icon
  if (process.platform === 'darwin' && app.dock) {
    const iconPath = path.join(__dirname, '../resources/icon.png')
    const icon = nativeImage.createFromPath(iconPath)
    if (!icon.isEmpty()) {
      app.dock.setIcon(icon)
    }
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// ============================================
// Auth Helper Functions
// ============================================

function getEndpoint() {
  let endpoint = null
  
  if (serviceKey?.endpoints?.ecmservice?.url) {
    endpoint = serviceKey.endpoints.ecmservice.url
  } else if (serviceKey?.uri) {
    endpoint = serviceKey.uri
  }
  
  // Remove trailing slash to avoid double slashes
  if (endpoint && endpoint.endsWith('/')) {
    endpoint = endpoint.slice(0, -1)
  }
  
  return endpoint
}

function getAuthUrl() {
  return serviceKey?.uaa?.url
}

function isTokenValid() {
  if (!accessToken || !tokenExpiry) return false
  return Date.now() < (tokenExpiry - 60000) // 60 seconds buffer
}

async function getAccessToken() {
  if (isTokenValid()) {
    return accessToken
  }

  const authUrl = getAuthUrl()
  const clientId = serviceKey?.uaa?.clientid
  const clientSecret = serviceKey?.uaa?.clientsecret

  if (!authUrl || !clientId || !clientSecret) {
    throw new Error('Service key not configured')
  }

  const response = await axios.post(
    `${authUrl}/oauth/token`,
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  accessToken = response.data.access_token
  const expiresIn = response.data.expires_in || 3600
  tokenExpiry = Date.now() + expiresIn * 1000

  return accessToken
}

// ============================================
// CPI Auth Helper Functions
// ============================================

function getCpiRuntimeUrl() {
  return cpiServiceKey?.oauth?.url || cpiServiceKey?.uaa?.url
}

function getCpiTokenUrl() {
  return cpiServiceKey?.oauth?.tokenurl || cpiServiceKey?.uaa?.tokenurl
}

function isCpiTokenValid() {
  if (!cpiAccessToken || !cpiTokenExpiry) return false
  return Date.now() < (cpiTokenExpiry - 60000)
}

async function getCpiAccessToken() {
  if (isCpiTokenValid()) {
    return cpiAccessToken
  }

  const tokenUrl = getCpiTokenUrl()
  const clientId = cpiServiceKey?.oauth?.clientid || cpiServiceKey?.uaa?.clientid
  const clientSecret = cpiServiceKey?.oauth?.clientsecret || cpiServiceKey?.uaa?.clientsecret

  if (!tokenUrl || !clientId || !clientSecret) {
    throw new Error('CPI service key not configured')
  }

  const response = await axios.post(
    tokenUrl,
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  cpiAccessToken = response.data.access_token
  const expiresIn = response.data.expires_in || 3600
  cpiTokenExpiry = Date.now() + expiresIn * 1000

  return cpiAccessToken
}

// ============================================
// IPC Handlers - Service Key Management
// ============================================

ipcMain.handle('load-service-key-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    title: 'Select SAP DMS Service Key',
  })

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, error: 'File selection canceled' }
  }

  try {
    const content = fs.readFileSync(result.filePaths[0], 'utf-8')
    const key = JSON.parse(content)
    
    // Validate required fields
    const hasEndpoints = key.endpoints?.ecmservice?.url || key.uri
    const hasUaa = key.uaa?.url && key.uaa?.clientid && key.uaa?.clientsecret
    
    if (!hasEndpoints || !hasUaa) {
      return { success: false, error: 'Invalid service key format. Missing required fields (endpoints/uaa).' }
    }

    return { success: true, data: key }
  } catch (error) {
    return { success: false, error: `Failed to read file: ${error.message}` }
  }
})

ipcMain.handle('save-service-key', async (event, key) => {
  try {
    serviceKey = key
    accessToken = null
    tokenExpiry = null
    
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(JSON.stringify(key))
      store.set('serviceKey', encrypted.toString('base64'))
      store.set('encrypted', true)
    } else {
      store.set('serviceKey', key)
      store.set('encrypted', false)
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-service-key', async () => {
  try {
    const isEncrypted = store.get('encrypted', false)
    const storedKey = store.get('serviceKey')
    
    if (!storedKey) {
      return { success: false, error: 'No service key stored' }
    }

    let key
    if (isEncrypted && safeStorage.isEncryptionAvailable()) {
      const decrypted = safeStorage.decryptString(Buffer.from(storedKey, 'base64'))
      key = JSON.parse(decrypted)
    } else {
      key = storedKey
    }
    
    serviceKey = key
    return { success: true, data: key }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('clear-service-key', async () => {
  try {
    serviceKey = null
    accessToken = null
    tokenExpiry = null
    store.delete('serviceKey')
    store.delete('encrypted')
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-auth-config', async () => {
  return {
    endpoint: getEndpoint(),
    authUrl: getAuthUrl(),
    clientId: serviceKey?.uaa?.clientid,
    hasToken: !!accessToken,
    tokenExpiry: tokenExpiry ? new Date(tokenExpiry).toISOString() : null,
  }
})

// ============================================
// IPC Handlers - CPI Service Key Management
// ============================================

ipcMain.handle('load-cpi-service-key-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    title: 'Select SAP CPI Service Key',
  })

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, error: 'File selection canceled' }
  }

  try {
    const content = fs.readFileSync(result.filePaths[0], 'utf-8')
    const key = JSON.parse(content)

    const oauth = key.oauth || key.uaa
    if (!oauth?.tokenurl || !oauth?.clientid || !oauth?.clientsecret) {
      return { success: false, error: 'Invalid CPI service key format. Missing required fields (tokenurl/clientid/clientsecret).' }
    }

    return { success: true, data: key }
  } catch (error) {
    return { success: false, error: `Failed to read file: ${error.message}` }
  }
})

ipcMain.handle('save-cpi-service-key', async (event, { key }) => {
  try {
    cpiServiceKey = key
    cpiAccessToken = null
    cpiTokenExpiry = null

    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(JSON.stringify(key))
      store.set('cpiServiceKey', encrypted.toString('base64'))
      store.set('cpiEncrypted', true)
    } else {
      store.set('cpiServiceKey', key)
      store.set('cpiEncrypted', false)
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-cpi-service-key', async () => {
  try {
    const isEncrypted = store.get('cpiEncrypted', false)
    const storedKey = store.get('cpiServiceKey')

    if (!storedKey) {
      return { success: false, error: 'No CPI service key stored' }
    }

    let key
    if (isEncrypted && safeStorage.isEncryptionAvailable()) {
      const decrypted = safeStorage.decryptString(Buffer.from(storedKey, 'base64'))
      key = JSON.parse(decrypted)
    } else {
      key = storedKey
    }

    cpiServiceKey = key
    return { success: true, data: key }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('clear-cpi-service-key', async () => {
  try {
    cpiServiceKey = null
    cpiAccessToken = null
    cpiTokenExpiry = null
    store.delete('cpiServiceKey')
    store.delete('cpiEncrypted')
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-cpi-auth-config', async () => {
  return {
    endpoint: getCpiRuntimeUrl() || '',
    tokenUrl: getCpiTokenUrl() || '',
    clientId: cpiServiceKey?.oauth?.clientid || cpiServiceKey?.uaa?.clientid || '',
    hasToken: !!cpiAccessToken,
    tokenExpiry: cpiTokenExpiry ? new Date(cpiTokenExpiry).toISOString() : null,
  }
})

ipcMain.handle('test-cpi-connection', async () => {
  try {
    await getCpiAccessToken()
    return { success: true }
  } catch (error) {
    return { success: false, error: error.response?.data?.error_description || error.message }
  }
})

ipcMain.handle('activate-cpi-archiving', async () => {
  try {
    const baseUrl = getCpiRuntimeUrl()
    if (!baseUrl) {
      return { success: false, error: 'CPI service key does not contain a runtime URL' }
    }

    const token = await getCpiAccessToken()
    const url = `${baseUrl}/api/v1/activateArchivingConfiguration`

    const response = await axios.post(url, null, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      timeout: 30000,
    })

    const message = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    return { success: true, message }
  } catch (error) {
    const status = error.response?.status || 0
    const message = error.response?.data?.message || error.response?.data || error.message
    const errorText = typeof message === 'string' ? message : JSON.stringify(message)
    return { success: false, error: `(${status}) ${errorText}` }
  }
})

// ============================================
// IPC Handlers - API Calls (via Main Process)
// ============================================

ipcMain.handle('test-connection', async () => {
  try {
    await getAccessToken()
    return { success: true }
  } catch (error) {
    return { success: false, error: error.response?.data?.error_description || error.message }
  }
})

ipcMain.handle('request-token', async () => {
  try {
    const token = await getAccessToken()
    const expiresIn = Math.round((tokenExpiry - Date.now()) / 1000)
    return { 
      success: true, 
      token,
      expiresIn,
      expiryTime: new Date(tokenExpiry).toISOString()
    }
  } catch (error) {
    return { success: false, error: error.response?.data?.error_description || error.message }
  }
})

ipcMain.handle('api-request', async (event, { method, path, data, params, responseType }) => {
  const startTime = Date.now()
  const endpoint = getEndpoint()
  
  if (!endpoint) {
    return { success: false, error: 'DMS endpoint not configured' }
  }

  try {
    const token = await getAccessToken()
    const url = `${endpoint}${path}`

    const config = {
      method,
      url,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        DataServiceVersion: '2.0',
      },
      params,
      timeout: 30000,
    }

    if (responseType) {
      config.responseType = responseType
    }

    if (data) {
      if (typeof data === 'string') {
        config.data = data
        config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
      } else {
        config.data = data
        config.headers['Content-Type'] = 'application/json'
      }
    }

    const response = await axios(config)

    // Log the request
    saveLog({
      type: 'api',
      level: 'info',
      method,
      url,
      status: response.status,
      duration: Date.now() - startTime,
      message: `${method} ${path} - ${response.status}`,
    })

    // Handle binary response
    if (responseType === 'arraybuffer') {
      return {
        success: true,
        data: {
          data: Buffer.from(response.data).toString('base64'),
          contentType: response.headers['content-type'],
          contentDisposition: response.headers['content-disposition'],
        },
      }
    }

    return { success: true, data: response.data }
  } catch (error) {
    const status = error.response?.status || 0
    const message = error.response?.data?.message || error.response?.data?.error || error.message

    saveLog({
      type: 'api',
      level: 'error',
      method,
      url: `${endpoint}${path}`,
      status,
      duration: Date.now() - startTime,
      message: `${method} ${path} - Error: ${message}`,
      error: message,
    })

    return { success: false, error: `API Error (${status}): ${message}`, status }
  }
})

ipcMain.handle('api-upload', async (event, { repoId, parentPath, fileName, fileBuffer, documentName }) => {
  const startTime = Date.now()
  const endpoint = getEndpoint()
  
  if (!endpoint) {
    return { success: false, error: 'DMS endpoint not configured' }
  }

  try {
    const token = await getAccessToken()
    const encodedPath = parentPath ? `/${encodeURIComponent(parentPath)}` : ''
    const url = `${endpoint}/browser/${repoId}/root${encodedPath}`

    const formData = new FormData()
    formData.append('cmisaction', 'createDocument')
    formData.append('propertyId[0]', 'cmis:objectTypeId')
    formData.append('propertyValue[0]', 'cmis:document')
    formData.append('propertyId[1]', 'cmis:name')
    formData.append('propertyValue[1]', documentName || fileName)
    formData.append('succinct', 'true')
    formData.append('filename', fileName)
    formData.append('includeAllowableActions', 'true')
    
    const buffer = Buffer.from(fileBuffer, 'base64')
    formData.append('media', buffer, { filename: fileName })

    const response = await axios.post(url, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        DataServiceVersion: '2.0',
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    })

    saveLog({
      type: 'api',
      level: 'info',
      method: 'POST',
      url,
      status: response.status,
      duration: Date.now() - startTime,
      message: `Upload ${fileName} - ${response.status}`,
    })

    return { success: true, data: response.data }
  } catch (error) {
    const status = error.response?.status || 0
    const message = error.response?.data?.message || error.message

    saveLog({
      type: 'api',
      level: 'error',
      method: 'POST',
      url: `${endpoint}/browser/${repoId}/root`,
      status,
      duration: Date.now() - startTime,
      message: `Upload ${fileName} - Error: ${message}`,
      error: message,
    })

    return { success: false, error: `Upload failed (${status}): ${message}` }
  }
})

// ============================================
// IPC Handlers - File Operations
// ============================================

ipcMain.handle('select-file-for-upload', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    title: 'Select File to Upload',
  })

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, error: 'File selection canceled' }
  }

  try {
    const filePath = result.filePaths[0]
    const fileName = path.basename(filePath)
    const fileBuffer = fs.readFileSync(filePath)
    
    return { 
      success: true, 
      data: {
        name: fileName,
        path: filePath,
        buffer: fileBuffer.toString('base64'),
        size: fileBuffer.length,
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('save-downloaded-file', async (event, { fileName, data }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: fileName,
    title: 'Save Downloaded File',
  })

  if (result.canceled) {
    return { success: false, error: 'Save canceled' }
  }

  try {
    const buffer = Buffer.from(data, 'base64')
    fs.writeFileSync(result.filePath, buffer)
    return { success: true, path: result.filePath }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// ============================================
// IPC Handlers - Logs
// ============================================

const MAX_LOGS = 1000
let logIdCounter = 0

function saveLog(logEntry) {
  try {
    const logs = store.get('logs', [])
    logIdCounter++
    logs.unshift({
      ...logEntry,
      id: `${Date.now()}-${logIdCounter}`,
      timestamp: new Date().toISOString(),
    })
    
    if (logs.length > MAX_LOGS) {
      logs.length = MAX_LOGS
    }
    
    store.set('logs', logs)
    
    // Send to renderer for real-time update
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('log-added', logs[0])
    }
  } catch (error) {
    console.error('Failed to save log:', error)
  }
}

ipcMain.handle('save-log', async (event, logEntry) => {
  try {
    saveLog(logEntry)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-logs', async (event, { limit = 100, offset = 0 } = {}) => {
  try {
    const logs = store.get('logs', [])
    return { 
      success: true, 
      data: logs.slice(offset, offset + limit),
      total: logs.length,
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('clear-logs', async () => {
  try {
    store.set('logs', [])
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// ============================================
// IPC Handlers - Settings
// ============================================

ipcMain.handle('get-setting', async (event, key) => {
  return store.get(`settings.${key}`)
})

ipcMain.handle('set-setting', async (event, key, value) => {
  store.set(`settings.${key}`, value)
  return { success: true }
})
