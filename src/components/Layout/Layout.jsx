import React from 'react'
import { Box } from '@mui/material'

function Layout({ children }) {
  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      {/* Title bar area */}
      <Box
        sx={{
          height: 32,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          // Make title bar draggable on macOS
          WebkitAppRegion: 'drag',
          WebkitUserSelect: 'none',
        }}
      >
        <Box
          component="span"
          sx={{
            fontSize: 13,
            fontWeight: 500,
            color: 'text.secondary',
            userSelect: 'none',
          }}
        >
          SAP DMS Client
        </Box>
      </Box>
      
      {/* Main content */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflow: 'hidden',
          // Disable drag for main content
          WebkitAppRegion: 'no-drag',
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

export default Layout
