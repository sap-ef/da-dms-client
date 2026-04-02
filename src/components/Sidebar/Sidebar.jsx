import React from 'react'
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  Typography,
  Chip,
} from '@mui/material'
import SapIcon from '../SapIcon'
import { useApp } from '../../context/AppContext'

const DRAWER_WIDTH = 240

const menuItems = [
  { id: 'repositories', label: 'Repositories', icon: 'database' },
  { id: 'explorer', label: 'File Explorer', icon: 'folder' },
  { id: 'query', label: 'CMIS Query', icon: 'search' },
  { id: 'logs', label: 'Logs', icon: 'history' },
]

function Sidebar() {
  const { state, actions } = useApp()
  const { currentView, isConfigured, isAuthenticated, selectedRepo } = state

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          position: 'relative',
          height: '100%',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Connection Status
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isConfigured ? (
            <>
              <SapIcon name="accept" fontSize="small" color="success" />
              <Typography variant="body2" color="success.main">
                Configured
              </Typography>
            </>
          ) : (
            <>
              <SapIcon name="error" fontSize="small" color="error" />
              <Typography variant="body2" color="error.main">
                Not Configured
              </Typography>
            </>
          )}
        </Box>
        {selectedRepo && (
          <Chip
            label={selectedRepo.externalId || selectedRepo.displayName || selectedRepo.id}
            size="small"
            color="primary"
            sx={{ mt: 1 }}
          />
        )}
      </Box>

      <Divider />

      <List sx={{ px: 1, py: 2 }}>
        {menuItems.map((item) => {
          const isDisabled = !isConfigured && item.id !== 'settings'
          
          return (
            <ListItemButton
              key={item.id}
              selected={currentView === item.id}
              onClick={() => actions.setView(item.id)}
              disabled={isDisabled}
              className="no-drag"
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <SapIcon name={item.icon} fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary={item.label}
                primaryTypographyProps={{ fontSize: 14 }}
              />
            </ListItemButton>
          )
        })}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <Divider />

      <List sx={{ px: 1, py: 1 }}>
        <ListItemButton
          selected={currentView === 'settings'}
          onClick={() => actions.setView('settings')}
          className="no-drag"
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <SapIcon name="action-settings" fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Settings"
            primaryTypographyProps={{ fontSize: 14 }}
          />
        </ListItemButton>
      </List>
    </Drawer>
  )
}

export default Sidebar
