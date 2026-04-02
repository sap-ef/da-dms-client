import React from 'react'
import { Box, Snackbar, Alert, LinearProgress } from '@mui/material'
import { useApp } from './context/AppContext'
import Layout from './components/Layout/Layout'
import Sidebar from './components/Sidebar/Sidebar'
import RepositoryView from './components/Repository/RepositoryView'
import FileExplorer from './components/FileExplorer/FileExplorer'
import QueryEditor from './components/QueryEditor/QueryEditor'
import LogsView from './components/Logs/LogsView'
import SettingsView from './components/Settings/SettingsView'

function App() {
  const { state, actions } = useApp()
  const { currentView, notification, loading, isConfigured } = state

  const renderContent = () => {
    // If not configured, always show settings
    if (!isConfigured) {
      return <SettingsView />
    }

    switch (currentView) {
      case 'repositories':
        return <RepositoryView />
      case 'explorer':
        return <FileExplorer />
      case 'query':
        return <QueryEditor />
      case 'logs':
        return <LogsView />
      case 'settings':
        return <SettingsView />
      default:
        return <RepositoryView />
    }
  }

  return (
    <Layout>
      <Box sx={{ display: 'flex', height: '100%' }}>
        <Sidebar />
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {loading && (
            <LinearProgress 
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                zIndex: 1100 
              }} 
            />
          )}
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
            {renderContent()}
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={!!notification}
        autoHideDuration={5000}
        onClose={actions.clearNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {notification && (
          <Alert 
            onClose={actions.clearNotification} 
            severity={notification.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        )}
      </Snackbar>
    </Layout>
  )
}

export default App
