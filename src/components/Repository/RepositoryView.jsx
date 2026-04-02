import React, { useEffect, useState, useRef } from 'react'
import { sapMonoFontFamily } from '../../styles/theme'
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import SapIcon from '../SapIcon'
import { useApp } from '../../context/AppContext'

function RepositoryView() {
  const { state, actions } = useApp()
  const { repositories, selectedRepo, loading, isConfigured } = state
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [repoToDelete, setRepoToDelete] = useState(null)
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [menuRepo, setMenuRepo] = useState(null)
  const loadedRef = useRef(false)
  
  const [newRepo, setNewRepo] = useState({
    displayName: '',
    description: '',
    repositoryId: '',
  })

  // Load repositories only once on mount
  useEffect(() => {
    if (isConfigured && !loadedRef.current) {
      loadedRef.current = true
      actions.loadRepositories()
    }
  }, [isConfigured, actions])

  const handleRefresh = () => {
    // Reset the ref to allow reloading
    loadedRef.current = false
    actions.loadRepositories()
  }

  const handleCreateRepository = async () => {
    const repoData = {
      displayName: newRepo.displayName,
      description: newRepo.description,
      repositoryType: 'internal',
      repositoryId: newRepo.repositoryId,
      externalId: newRepo.repositoryId,
    }

    const result = await actions.createRepository(repoData)
    if (result.success) {
      actions.setNotification('Repository created successfully', 'success')
      setCreateDialogOpen(false)
      setNewRepo({
        displayName: '',
        description: '',
        repositoryId: '',
      })
      // Reset the ref so repositories reload properly
      loadedRef.current = false
      actions.loadRepositories()
    } else {
      actions.setNotification(`Failed to create repository: ${result.error}`, 'error')
    }
  }

  const handleDeleteRepository = async () => {
    if (!repoToDelete) return
    
    const result = await actions.deleteRepository(repoToDelete.id)
    if (result.success) {
      actions.setNotification('Repository deleted successfully', 'success')
      setDeleteDialogOpen(false)
      setRepoToDelete(null)
      if (selectedRepo?.id === repoToDelete.id) {
        actions.selectRepository(null)
      }
      // Reset the ref so repositories reload properly
      loadedRef.current = false
      actions.loadRepositories()
    } else {
      actions.setNotification(`Failed to delete repository: ${result.error}`, 'error')
    }
  }

  const handleSelectRepo = (repo) => {
    actions.selectRepository(repo)
    actions.setNotification(`Selected repository: ${repo.name || repo.displayName || repo.id}`, 'info')
  }

  const handleOpenExplorer = (repo) => {
    actions.selectRepository(repo)
    actions.setView('explorer')
  }

  const handleMenuOpen = (event, repo) => {
    setMenuAnchor(event.currentTarget)
    setMenuRepo(repo)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setMenuRepo(null)
  }

  const handleExportDestination = async (repo) => {
    try {
      const keyResult = await window.electronAPI.getServiceKey()
      if (!keyResult.success || !keyResult.data) {
        actions.setNotification('Service key not available', 'error')
        return
      }

      const key = keyResult.data
      const baseUrl = key.endpoints?.ecmservice?.url || key.uri || ''
      const tokenBaseUrl = key.uaa?.url || ''

      const destination = {
        exportTime: new Date().toISOString().replace('T', ' ').replace('Z', ''),
        destination: {
          Name: 'CloudIntegration_LogArchive',
          Type: 'HTTP',
          Description: '',
          URL: `${baseUrl}/browser`,
          ProxyType: 'Internet',
          Authentication: 'OAuth2ClientCredentials',
          RepositoryId: repo.externalId || '',
          clientId: key.uaa?.clientid || '',
          clientSecret: key.uaa?.clientsecret || '',
          tokenServiceURL: `${tokenBaseUrl}/oauth/token`,
          tokenServiceURLType: 'Dedicated',
        },
      }

      const jsonContent = JSON.stringify(destination, null, 2)
      const buffer = Array.from(new TextEncoder().encode(jsonContent))
      await window.electronAPI.saveDownloadedFile('CloudIntegration_LogArchive.json', buffer)
      actions.setNotification('Destination exported successfully', 'success')
    } catch (error) {
      actions.setNotification(`Export failed: ${error.message}`, 'error')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Repositories
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<SapIcon name="refresh" />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<SapIcon name="add" />}
            onClick={() => setCreateDialogOpen(true)}
            disabled={loading}
          >
            Create Repository
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>Name</TableCell>
              <TableCell>Repository ID</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {repositories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No repositories found. Create one to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              repositories.map((repo) => (
                <TableRow 
                  key={repo.id}
                  hover
                  selected={selectedRepo?.id === repo.id}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleSelectRepo(repo)}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedRepo?.id === repo.id}
                      onChange={() => handleSelectRepo(repo)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SapIcon name="folder" color="primary" fontSize="small" />
                      <Typography variant="body2" fontWeight={500}>
                        {repo.name || repo.displayName || repo.id}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily={sapMonoFontFamily} fontSize={12}>
                      {repo.externalId || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {repo.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      aria-label="Open actions menu"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMenuOpen(e, repo)
                      }}
                    >
                      <SapIcon name="overflow" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleOpenExplorer(menuRepo)
          handleMenuClose()
        }}>
          <ListItemIcon>
            <SapIcon name="open-folder" fontSize="small" />
          </ListItemIcon>
          <ListItemText>Open in Explorer</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleExportDestination(menuRepo)
          handleMenuClose()
        }}>
          <ListItemIcon>
            <SapIcon name="export" fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export Destination</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          setRepoToDelete(menuRepo)
          setDeleteDialogOpen(true)
          handleMenuClose()
        }}>
          <ListItemIcon>
            <SapIcon name="delete" fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create Repository Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Repository</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Display Name"
              value={newRepo.displayName}
              onChange={(e) => setNewRepo({ ...newRepo, displayName: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Repository ID"
              value={newRepo.repositoryId}
              onChange={(e) => setNewRepo({ ...newRepo, repositoryId: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={newRepo.description}
              onChange={(e) => setNewRepo({ ...newRepo, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateRepository}
            disabled={!newRepo.displayName || !newRepo.repositoryId || loading}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Repository Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Repository</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the repository "{repoToDelete?.name || repoToDelete?.displayName || repoToDelete?.id}"? 
            This action cannot be undone and all documents will be permanently deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleDeleteRepository}
            disabled={loading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default RepositoryView
