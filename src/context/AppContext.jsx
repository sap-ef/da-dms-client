import React, { createContext, useContext, useReducer, useEffect } from 'react'
import authService from '../services/auth'
import cpiAuthService from '../services/cpi-auth'
import dmsApi from '../services/dms-api'

const AppContext = createContext(null)

const initialState = {
  // Auth state
  isConfigured: false,
  isAuthenticated: false,
  authConfig: null,

  // CPI Auth state
  cpiIsConfigured: false,
  cpiAuthConfig: null,
  
  // Navigation
  currentView: 'repositories',
  
  // Repository state
  repositories: [],
  selectedRepo: null,
  
  // Explorer state
  currentPath: '',
  currentFolder: null,
  folderContents: [],
  breadcrumbs: [],
  
  // UI state
  loading: false,
  error: null,
  notification: null,
  
  // Logs
  logs: [],
  logsTotal: 0,
}

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_CONFIGURED':
      return { ...state, isConfigured: action.payload }
    
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload }
    
    case 'SET_AUTH_CONFIG':
      return { ...state, authConfig: action.payload }

    case 'SET_CPI_CONFIGURED':
      return { ...state, cpiIsConfigured: action.payload }

    case 'SET_CPI_AUTH_CONFIG':
      return { ...state, cpiAuthConfig: action.payload }

    case 'SET_CURRENT_VIEW':
      return { ...state, currentView: action.payload }
    
    case 'SET_REPOSITORIES':
      return { ...state, repositories: action.payload }
    
    case 'SET_SELECTED_REPO':
      return { 
        ...state, 
        selectedRepo: action.payload,
        currentPath: '',
        currentFolder: null,
        folderContents: [],
        breadcrumbs: [],
      }
    
    case 'SET_FOLDER_CONTENTS':
      return { 
        ...state, 
        folderContents: action.payload.objects || [],
        currentFolder: action.payload.folder,
        currentPath: action.payload.path,
        breadcrumbs: action.payload.breadcrumbs || [],
      }
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'SET_NOTIFICATION':
      return { ...state, notification: action.payload }
    
    case 'CLEAR_NOTIFICATION':
      return { ...state, notification: null }
    
    case 'SET_LOGS':
      return { ...state, logs: action.payload.logs, logsTotal: action.payload.total }
    
    case 'ADD_LOG':
      return { 
        ...state, 
        logs: [action.payload, ...state.logs].slice(0, 100),
        logsTotal: state.logsTotal + 1,
      }
    
    case 'CLEAR_LOGS':
      return { ...state, logs: [], logsTotal: 0 }
    
    case 'RESET_STATE':
      return {
        ...initialState,
        currentView: state.currentView,
        cpiIsConfigured: state.cpiIsConfigured,
        cpiAuthConfig: state.cpiAuthConfig,
      }
    
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Listen for logs from main process
  useEffect(() => {
    if (window.electronAPI?.onLogAdded) {
      window.electronAPI.onLogAdded((log) => {
        dispatch({ type: 'ADD_LOG', payload: log })
      })
    }
  }, [])

  // Load stored service key on startup
  useEffect(() => {
    const loadStoredServiceKey = async () => {
      try {
        const result = await window.electronAPI.getServiceKey()
        if (result.success && result.data) {
          authService.setServiceKey(result.data)
          dispatch({ type: 'SET_CONFIGURED', payload: true })
          const config = await authService.getConfig()
          dispatch({ type: 'SET_AUTH_CONFIG', payload: config })
        }
      } catch (err) {
        console.error('Failed to load stored service key:', err)
      }
    }
    loadStoredServiceKey()
  }, [])

  // Load stored CPI service key on startup
  useEffect(() => {
    const loadStoredCpiServiceKey = async () => {
      try {
        const result = await window.electronAPI.getCpiServiceKey()
        if (result.success && result.data) {
          cpiAuthService.setServiceKey(result.data)
          dispatch({ type: 'SET_CPI_CONFIGURED', payload: true })
          const config = await cpiAuthService.getConfig()
          dispatch({ type: 'SET_CPI_AUTH_CONFIG', payload: config })
        }
      } catch (err) {
        console.error('Failed to load stored CPI service key:', err)
      }
    }
    loadStoredCpiServiceKey()
  }, [])

  // Load stored logs on startup
  useEffect(() => {
    const loadStoredLogs = async () => {
      try {
        const result = await window.electronAPI.getLogs({ limit: 100 })
        if (result.success) {
          dispatch({ type: 'SET_LOGS', payload: { logs: result.data, total: result.total } })
        }
      } catch (err) {
        console.error('Failed to load stored logs:', err)
      }
    }
    loadStoredLogs()
  }, [])

  const value = {
    state,
    dispatch,
    
    actions: {
      setView: (view) => dispatch({ type: 'SET_CURRENT_VIEW', payload: view }),
      
      setNotification: (message, severity = 'info') => {
        dispatch({ type: 'SET_NOTIFICATION', payload: { message, severity } })
      },
      
      clearNotification: () => dispatch({ type: 'CLEAR_NOTIFICATION' }),
      
      setError: (error) => dispatch({ type: 'SET_ERROR', payload: error }),
      
      setLoading: (loading) => dispatch({ type: 'SET_LOADING', payload: loading }),
      
      async configureAuth(serviceKey) {
        authService.setServiceKey(serviceKey)
        await window.electronAPI.saveServiceKey(serviceKey)
        dispatch({ type: 'SET_CONFIGURED', payload: true })
        const config = await authService.getConfig()
        dispatch({ type: 'SET_AUTH_CONFIG', payload: config })
      },
      
      async clearAuth() {
        authService.setServiceKey(null)
        await window.electronAPI.clearServiceKey()
        dispatch({ type: 'RESET_STATE' })
      },

      async configureCpiAuth(serviceKey) {
        cpiAuthService.setServiceKey(serviceKey)
        await window.electronAPI.saveCpiServiceKey({ key: serviceKey })
        dispatch({ type: 'SET_CPI_CONFIGURED', payload: true })
        const config = await cpiAuthService.getConfig()
        dispatch({ type: 'SET_CPI_AUTH_CONFIG', payload: config })
      },

      async clearCpiAuth() {
        cpiAuthService.setServiceKey(null)
        await window.electronAPI.clearCpiServiceKey()
        dispatch({ type: 'SET_CPI_CONFIGURED', payload: false })
        dispatch({ type: 'SET_CPI_AUTH_CONFIG', payload: null })
      },

      async testCpiConnection() {
        dispatch({ type: 'SET_LOADING', payload: true })
        try {
          const result = await window.electronAPI.testCpiConnection()
          if (result.success) {
            const config = await cpiAuthService.getConfig()
            dispatch({ type: 'SET_CPI_AUTH_CONFIG', payload: config })
          }
          return result
        } catch (error) {
          return { success: false, error: error.message }
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      },

      async testConnection() {
        dispatch({ type: 'SET_LOADING', payload: true })
        try {
          const result = await window.electronAPI.testConnection()
          if (result.success) {
            dispatch({ type: 'SET_AUTHENTICATED', payload: true })
            const config = await authService.getConfig()
            dispatch({ type: 'SET_AUTH_CONFIG', payload: config })
          } else {
            dispatch({ type: 'SET_AUTHENTICATED', payload: false })
          }
          return result
        } catch (error) {
          dispatch({ type: 'SET_AUTHENTICATED', payload: false })
          return { success: false, error: error.message }
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      },
      
      async loadRepositories() {
        dispatch({ type: 'SET_LOADING', payload: true })
        try {
          const data = await dmsApi.listRepositoriesRest()
          
          // Handle different response structures
          let repos = []
          if (data.repositories) {
            // Multiple repositories or array format
            repos = Array.isArray(data.repositories) ? data.repositories : [data.repositories]
          } else if (data.repoAndConnectionInfos) {
            // Extract repository info from nested structure
            repos = Array.isArray(data.repoAndConnectionInfos) 
              ? data.repoAndConnectionInfos.map(item => item.repository || item)
              : [data.repoAndConnectionInfos.repository || data.repoAndConnectionInfos]
          } else if (Array.isArray(data)) {
            // Response is directly an array
            repos = data
          } else if (data && typeof data === 'object' && (data.id || data.repositoryId || data.displayName)) {
            // Single repository object returned directly
            repos = [data]
          }
          
          dispatch({ type: 'SET_REPOSITORIES', payload: repos })
          return { success: true, data: repos }
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error.message })
          return { success: false, error: error.message }
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      },
      
      async createRepository(repoData) {
        dispatch({ type: 'SET_LOADING', payload: true })
        try {
          await dmsApi.createRepository(repoData)
          return { success: true }
        } catch (error) {
          return { success: false, error: error.message }
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      },
      
      async deleteRepository(repoId) {
        dispatch({ type: 'SET_LOADING', payload: true })
        try {
          await dmsApi.deleteRepository(repoId)
          return { success: true }
        } catch (error) {
          return { success: false, error: error.message }
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      },
      
      selectRepository(repo) {
        dispatch({ type: 'SET_SELECTED_REPO', payload: repo })
      },
      
      async loadFolderContents(path = '') {
        const { selectedRepo } = state
        if (!selectedRepo) return { success: false, error: 'No repository selected' }
        
        dispatch({ type: 'SET_LOADING', payload: true })
        try {
          const data = await dmsApi.listRootDocuments(selectedRepo.id)
          
          const breadcrumbs = [{ name: 'Root', path: '' }]
          if (path) {
            const parts = path.split('/')
            let currentPath = ''
            for (const part of parts) {
              currentPath += (currentPath ? '/' : '') + part
              breadcrumbs.push({ name: part, path: currentPath })
            }
          }
          
          dispatch({ 
            type: 'SET_FOLDER_CONTENTS', 
            payload: { 
              objects: data.objects || [], 
              path,
              breadcrumbs,
            } 
          })
          return { success: true, data }
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error.message })
          return { success: false, error: error.message }
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      },
      
      async loadChildren(objectId, folderName) {
        const { selectedRepo, breadcrumbs: currentBreadcrumbs } = state
        if (!selectedRepo) return { success: false, error: 'No repository selected' }

        dispatch({ type: 'SET_LOADING', payload: true })
        try {
          const data = await dmsApi.listChildren(selectedRepo.id, objectId)

          const breadcrumbs = [...(currentBreadcrumbs.length ? currentBreadcrumbs : [{ name: 'Root', path: '' }])]
          const parentPath = breadcrumbs[breadcrumbs.length - 1]?.path || ''
          const newPath = parentPath ? `${parentPath}/${folderName}` : folderName
          breadcrumbs.push({ name: folderName, path: newPath, objectId })

          dispatch({
            type: 'SET_FOLDER_CONTENTS',
            payload: {
              objects: data.objects || [],
              folder: { objectId },
              path: newPath,
              breadcrumbs,
            }
          })
          return { success: true, data }
        } catch (error) {
          dispatch({ type: 'SET_ERROR', payload: error.message })
          return { success: false, error: error.message }
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      },
      
      async createFolder(parentPath, folderName) {
        const { selectedRepo } = state
        if (!selectedRepo) return { success: false, error: 'No repository selected' }
        
        dispatch({ type: 'SET_LOADING', payload: true })
        try {
          await dmsApi.createFolder(selectedRepo.id, parentPath, folderName)
          return { success: true }
        } catch (error) {
          return { success: false, error: error.message }
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      },
      
      async uploadDocument(parentPath, file) {
        const { selectedRepo } = state
        if (!selectedRepo) return { success: false, error: 'No repository selected' }
        
        dispatch({ type: 'SET_LOADING', payload: true })
        try {
          await dmsApi.uploadDocument(selectedRepo.id, parentPath, file.name, file.buffer)
          return { success: true }
        } catch (error) {
          return { success: false, error: error.message }
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      },
      
      async downloadDocument(objectId, fileName) {
        const { selectedRepo } = state
        if (!selectedRepo) return { success: false, error: 'No repository selected' }
        
        dispatch({ type: 'SET_LOADING', payload: true })
        try {
          const result = await dmsApi.downloadDocument(selectedRepo.id, objectId)
          await window.electronAPI.saveDownloadedFile(fileName, result.data)
          return { success: true }
        } catch (error) {
          return { success: false, error: error.message }
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      },
      
      async deleteObject(objectId) {
        const { selectedRepo } = state
        if (!selectedRepo) return { success: false, error: 'No repository selected' }
        
        dispatch({ type: 'SET_LOADING', payload: true })
        try {
          await dmsApi.deleteObject(selectedRepo.id, objectId)
          return { success: true }
        } catch (error) {
          return { success: false, error: error.message }
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      },
      
      async moveObject(objectId, sourceFolderId, targetFolderId) {
        const { selectedRepo } = state
        if (!selectedRepo) return { success: false, error: 'No repository selected' }
        
        dispatch({ type: 'SET_LOADING', payload: true })
        try {
          await dmsApi.moveObject(selectedRepo.id, objectId, sourceFolderId, targetFolderId)
          return { success: true }
        } catch (error) {
          return { success: false, error: error.message }
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      },
      
      async updateObject(objectId, properties) {
        const { selectedRepo } = state
        if (!selectedRepo) return { success: false, error: 'No repository selected' }
        
        dispatch({ type: 'SET_LOADING', payload: true })
        try {
          await dmsApi.updateObject(selectedRepo.id, objectId, properties)
          return { success: true }
        } catch (error) {
          return { success: false, error: error.message }
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      },
      
      async executeQuery(query) {
        const { selectedRepo } = state
        if (!selectedRepo) return { success: false, error: 'No repository selected' }
        
        dispatch({ type: 'SET_LOADING', payload: true })
        try {
          const data = await dmsApi.executeQuery(selectedRepo.id, query)
          return { success: true, data }
        } catch (error) {
          return { success: false, error: error.message }
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      },
      
      async refreshLogs() {
        try {
          const result = await window.electronAPI.getLogs({ limit: 100 })
          if (result.success) {
            dispatch({ type: 'SET_LOGS', payload: { logs: result.data, total: result.total } })
          }
        } catch (err) {
          console.error('Failed to refresh logs:', err)
        }
      },
      
      async clearLogs() {
        try {
          await window.electronAPI.clearLogs()
          dispatch({ type: 'CLEAR_LOGS' })
        } catch (err) {
          console.error('Failed to clear logs:', err)
        }
      },
    },
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export default AppContext
