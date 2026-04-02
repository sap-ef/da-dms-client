import React, { useEffect, useRef } from 'react'
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
  Chip,
  Tooltip,
} from '@mui/material'
import SapIcon from '../SapIcon'
import { useApp } from '../../context/AppContext'

function LogsView() {
  const { state, actions } = useApp()
  const { logs, logsTotal, loading } = state
  const loadedRef = useRef(false)

  const handleRefresh = () => {
    actions.refreshLogs()
  }

  // Load logs only once on mount
  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true
      actions.refreshLogs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClearLogs = async () => {
    await actions.clearLogs()
    actions.setNotification('Logs cleared', 'info')
  }

  const getLevelIcon = (level) => {
    switch (level) {
      case 'error':
        return <SapIcon name="error" color="error" fontSize="small" />
      case 'warning':
        return <SapIcon name="warning" color="warning" fontSize="small" />
      case 'success':
        return <SapIcon name="accept" color="success" fontSize="small" />
      default:
        return <SapIcon name="information" color="info" fontSize="small" />
    }
  }

  const getLevelColor = (level) => {
    switch (level) {
      case 'error':
        return 'error'
      case 'warning':
        return 'warning'
      case 'success':
        return 'success'
      default:
        return 'info'
    }
  }

  const getStatusColor = (status) => {
    if (!status) return 'default'
    if (status >= 200 && status < 300) return 'success'
    if (status >= 400 && status < 500) return 'warning'
    if (status >= 500) return 'error'
    return 'default'
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-'
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + '.' + String(date.getMilliseconds()).padStart(3, '0')
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">
            Logs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {logsTotal} total entries
          </Typography>
        </Box>
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
            variant="outlined"
            color="error"
            startIcon={<SapIcon name="delete" />}
            onClick={handleClearLogs}
            disabled={loading || logs.length === 0}
          >
            Clear All
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 250px)' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell width={40}></TableCell>
              <TableCell width={100}>Time</TableCell>
              <TableCell width={80}>Method</TableCell>
              <TableCell width={80}>Status</TableCell>
              <TableCell>Message</TableCell>
              <TableCell width={80}>Duration</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No logs yet. API calls will appear here.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    {getLevelIcon(log.level)}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={formatDate(log.timestamp)}>
                      <Typography variant="body2" fontFamily={sapMonoFontFamily} fontSize={11}>
                        {formatTimestamp(log.timestamp)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {log.method && (
                      <Chip 
                        label={log.method} 
                        size="small" 
                        variant="outlined"
                        sx={{ 
                          fontSize: 10, 
                          height: 20,
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {log.status ? (
                      <Chip 
                        label={log.status} 
                        size="small" 
                        color={getStatusColor(log.status)}
                        sx={{ fontSize: 10, height: 20 }}
                      />
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={log.url || ''}>
                      <Typography 
                        variant="body2" 
                        fontSize={12}
                        sx={{ 
                          maxWidth: 400, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {log.message}
                      </Typography>
                    </Tooltip>
                    {log.error && (
                      <Typography 
                        variant="body2" 
                        fontSize={11}
                        color="error"
                        sx={{ mt: 0.5 }}
                      >
                        {log.error}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily={sapMonoFontFamily} fontSize={11}>
                      {log.duration ? `${log.duration}ms` : '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default LogsView
