import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { AppProvider } from './context/AppContext'
import App from './App'
import horizonDarkTheme from './styles/theme'
import './styles/sap-fonts.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider theme={horizonDarkTheme}>
    <CssBaseline />
    <AppProvider>
      <App />
    </AppProvider>
  </ThemeProvider>
)
