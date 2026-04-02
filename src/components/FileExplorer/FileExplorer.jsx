import React, { useEffect, useState, useRef } from 'react'
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
  Breadcrumbs,
  Link,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Tooltip,
} from '@mui/material'
import SapIcon from '../SapIcon'
import { useApp } from '../../context/AppContext'
import dmsApi from '../../services/dms-api'

function FileExplorer() {
  const { state, actions, dispatch } = useApp()
  const { selectedRepo, folderContents, currentPath, breadcrumbs, loading } = state
  
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [itemToRename, setItemToRename] = useState(null)
  const [newName, setNewName] = useState('')
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [menuItem, setMenuItem] = useState(null)
  const loadedRepoRef = useRef(null)

  // Refresh function to reload current folder contents
  const handleRefresh = () => {
    if (selectedRepo) {
      actions.loadFolderContents(currentPath)
    }
  }

  // Load contents only when repo changes or on first mount
  useEffect(() => {
    if (!selectedRepo) return
    
    // Only load if repo changed or first time
    if (loadedRepoRef.current !== selectedRepo.id) {
      loadedRepoRef.current = selectedRepo.id
      actions.loadFolderContents('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRepo?.id])

  const handleNavigate = async (item) => {
    if (item.object?.properties?.['cmis:baseTypeId']?.value === 'cmis:folder' ||
        item.object?.properties?.['cmis:objectTypeId']?.value === 'cmis:folder') {
      const objectId = item.object?.properties?.['cmis:objectId']?.value
      const folderName = item.object?.properties?.['cmis:name']?.value || 'Unnamed'
      if (objectId) {
        await actions.loadChildren(objectId, folderName)
      }
    }
  }

  const handleBreadcrumbClick = async (crumb) => {
    if (!crumb.objectId) {
      // Root - reload from root
      await actions.loadFolderContents('')
    } else {
      // Navigate to a specific folder by its objectId
      const crumbIndex = breadcrumbs.findIndex(b => b.path === crumb.path)
      const trimmedBreadcrumbs = breadcrumbs.slice(0, crumbIndex + 1)
      if (selectedRepo) {
        actions.setLoading(true)
        try {
          const data = await dmsApi.listChildren(selectedRepo.id, crumb.objectId)
          dispatch({
            type: 'SET_FOLDER_CONTENTS',
            payload: {
              objects: data.objects || [],
              folder: { objectId: crumb.objectId },
              path: crumb.path,
              breadcrumbs: trimmedBreadcrumbs,
            }
          })
        } finally {
          actions.setLoading(false)
        }
      }
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    
    const result = await actions.createFolder(currentPath, newFolderName)
    if (result.success) {
      actions.setNotification('Folder created successfully', 'success')
      setCreateFolderOpen(false)
      setNewFolderName('')
      handleRefresh()
    } else {
      actions.setNotification(`Failed to create folder: ${result.error}`, 'error')
    }
  }

  const handleUpload = async () => {
    try {
      const result = await window.electronAPI.selectFileForUpload()
      if (!result.success) {
        if (result.error !== 'File selection canceled') {
          actions.setNotification(result.error, 'error')
        }
        return
      }

      const uploadResult = await actions.uploadDocument(currentPath, result.data)
      if (uploadResult.success) {
        actions.setNotification(`File "${result.data.name}" uploaded successfully`, 'success')
        handleRefresh()
      } else {
        actions.setNotification(`Upload failed: ${uploadResult.error}`, 'error')
      }
    } catch (error) {
      actions.setNotification(`Upload error: ${error.message}`, 'error')
    }
  }

  const handleDownload = async (item) => {
    const objectId = item.object?.properties?.['cmis:objectId']?.value
    const fileName = item.object?.properties?.['cmis:name']?.value || 'download'
    
    if (!objectId) {
      actions.setNotification('Cannot download: missing object ID', 'error')
      return
    }

    const result = await actions.downloadDocument(objectId, fileName)
    if (result.success) {
      actions.setNotification(`File downloaded successfully`, 'success')
    } else {
      actions.setNotification(`Download failed: ${result.error}`, 'error')
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    
    const objectId = itemToDelete.object?.properties?.['cmis:objectId']?.value
    if (!objectId) {
      actions.setNotification('Cannot delete: missing object ID', 'error')
      return
    }

    const result = await actions.deleteObject(objectId)
    if (result.success) {
      actions.setNotification('Item deleted successfully', 'success')
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      handleRefresh()
    } else {
      actions.setNotification(`Delete failed: ${result.error}`, 'error')
    }
  }

  const handleRename = async () => {
    if (!itemToRename || !newName.trim()) return
    
    const objectId = itemToRename.object?.properties?.['cmis:objectId']?.value
    if (!objectId) {
      actions.setNotification('Cannot rename: missing object ID', 'error')
      return
    }

    const result = await actions.updateObject(objectId, { 'cmis:name': newName })
    if (result.success) {
      actions.setNotification('Item renamed successfully', 'success')
      setRenameDialogOpen(false)
      setItemToRename(null)
      setNewName('')
      handleRefresh()
    } else {
      actions.setNotification(`Rename failed: ${result.error}`, 'error')
    }
  }

  const handleMenuOpen = (event, item) => {
    event.stopPropagation()
    setMenuAnchor(event.currentTarget)
    setMenuItem(item)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setMenuItem(null)
  }

  const isFolder = (item) => {
    if (!item) return false
    const baseType = item.object?.properties?.['cmis:baseTypeId']?.value
    const objectType = item.object?.properties?.['cmis:objectTypeId']?.value
    return baseType === 'cmis:folder' || objectType === 'cmis:folder'
  }

  const getItemName = (item) => {
    if (!item) return 'Unnamed'
    return item.object?.properties?.['cmis:name']?.value || 'Unnamed'
  }

  const getItemSize = (item) => {
    if (!item) return '-'
    const size = item.object?.properties?.['cmis:contentStreamLength']?.value
    if (!size) return '-'
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const getItemDate = (item) => {
    if (!item) return '-'
    const date = item.object?.properties?.['cmis:lastModificationDate']?.value
    if (!date) return '-'
    return new Date(date).toLocaleString()
  }

  const getItemType = (item) => {
    if (!item) return 'Unknown'
    if (isFolder(item)) return 'Folder'
    const mimeType = item.object?.properties?.['cmis:contentStreamMimeType']?.value
    return mimeType || 'File'
  }

  if (!selectedRepo) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 3 }}>
          File Explorer
        </Typography>
        <Alert severity="info">
          Please select a repository from the Repositories view to browse files.
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          File Explorer
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<SapIcon name="refresh" />}
            onClick={handleRefresh}
            disabled={loading}
            size="small"
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<SapIcon name="create-folder" />}
            onClick={() => setCreateFolderOpen(true)}
            disabled={loading}
            size="small"
          >
            New Folder
          </Button>
          <Button
            variant="contained"
            startIcon={<SapIcon name="upload" />}
            onClick={handleUpload}
            disabled={loading}
            size="small"
          >
            Upload
          </Button>
        </Box>
      </Box>

      {/* Repository Info */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Repository
            </Typography>
            <Typography variant="h6">
              {selectedRepo.name || selectedRepo.displayName || selectedRepo.id}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Repository ID: {selectedRepo.externalId || '-'}
            </Typography>
          </Box>
        </Box>
        <Box>
          <Breadcrumbs separator={<SapIcon name="navigation-right-arrow" fontSize="small" />}>
            <Link
              component="button"
              underline="hover"
              color="inherit"
              onClick={() => handleBreadcrumbClick({ name: 'Root', path: '' })}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <SapIcon name="home" fontSize="small" />
              Root
            </Link>
            {breadcrumbs.slice(1).map((crumb, index) => (
              <Link
                key={crumb.path}
                component="button"
                underline="hover"
                color={index === breadcrumbs.length - 2 ? 'text.primary' : 'inherit'}
                onClick={() => handleBreadcrumbClick(crumb)}
              >
                {crumb.name}
              </Link>
            ))}
          </Breadcrumbs>
        </Box>
      </Paper>

      {/* File Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Modified</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {folderContents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    This folder is empty
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              folderContents.map((item) => {
                const itemIsFolder = isFolder(item)
                const name = getItemName(item)
                const objectId = item.object?.properties?.['cmis:objectId']?.value || name
                
                return (
                  <TableRow 
                    key={objectId}
                    hover
                    sx={{ cursor: itemIsFolder ? 'pointer' : 'default' }}
                    onClick={() => itemIsFolder && handleNavigate(item)}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {itemIsFolder ? (
                          <SapIcon name="folder" color="primary" />
                        ) : (
                          <SapIcon name="document" color="action" />
                        )}
                        <Typography variant="body2" fontWeight={itemIsFolder ? 500 : 400}>
                          {name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {getItemType(item)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {getItemSize(item)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {getItemDate(item)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        aria-label="Open actions menu"
                        onClick={(e) => handleMenuOpen(e, item)}
                      >
                        <SapIcon name="overflow" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )
              })
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
        {menuItem && !isFolder(menuItem) && (
          <MenuItem onClick={() => {
            handleDownload(menuItem)
            handleMenuClose()
          }}>
            <ListItemIcon>
              <SapIcon name="download" fontSize="small" />
            </ListItemIcon>
            <ListItemText>Download</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => {
          setItemToRename(menuItem)
          setNewName(getItemName(menuItem))
          setRenameDialogOpen(true)
          handleMenuClose()
        }}>
          <ListItemIcon>
            <SapIcon name="edit" fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          setItemToDelete(menuItem)
          setDeleteDialogOpen(true)
          handleMenuClose()
        }}>
          <ListItemIcon>
            <SapIcon name="delete" fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create Folder Dialog */}
      <Dialog 
        open={createFolderOpen} 
        onClose={() => setCreateFolderOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Folder Name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateFolderOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateFolder}
            disabled={!newFolderName.trim() || loading}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Item</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{itemToDelete && getItemName(itemToDelete)}"? 
            {isFolder(itemToDelete) && ' All contents will be permanently deleted.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleDelete}
            disabled={loading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog 
        open={renameDialogOpen} 
        onClose={() => setRenameDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Rename Item</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="New Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
            onKeyPress={(e) => e.key === 'Enter' && handleRename()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleRename}
            disabled={!newName.trim() || loading}
          >
            Rename
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default FileExplorer
