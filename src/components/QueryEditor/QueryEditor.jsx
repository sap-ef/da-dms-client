import React, { useState } from 'react'
import { sapMonoFontFamily } from '../../styles/theme'
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Chip,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material'
import SapIcon from '../SapIcon'
import { useApp } from '../../context/AppContext'

// Example queries for quick access
const EXAMPLE_QUERIES = [
  {
    name: 'List all folders',
    query: "SELECT * FROM cmis:folder",
  },
  {
    name: 'List all documents',
    query: "SELECT * FROM cmis:document",
  },
  {
    name: 'Search by name',
    query: "SELECT cmis:name, cmis:objectId FROM cmis:document WHERE cmis:name LIKE '%example%'",
  },
  {
    name: 'Recent documents',
    query: "SELECT cmis:name, cmis:lastModificationDate FROM cmis:document ORDER BY cmis:lastModificationDate DESC",
  },
]

function QueryEditor() {
  const { state, actions } = useApp()
  const { selectedRepo, loading } = state
  
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [columns, setColumns] = useState([])

  const handleRunQuery = async () => {
    if (!query.trim()) {
      setError('Please enter a query')
      return
    }

    setError(null)
    setResults(null)
    setColumns([])

    const result = await actions.executeQuery(query)
    
    if (result.success) {
      const data = result.data
      
      // Extract results from CMIS response
      if (data.results && Array.isArray(data.results)) {
        // Extract column names from first result
        if (data.results.length > 0) {
          const firstResult = data.results[0]
          const props = firstResult.succinctProperties || firstResult.properties || {}
          setColumns(Object.keys(props))
        }
        setResults(data.results)
      } else if (data.objects && Array.isArray(data.objects)) {
        // Alternative format
        if (data.objects.length > 0) {
          const firstObj = data.objects[0]
          const props = firstObj.object?.succinctProperties || firstObj.object?.properties || {}
          setColumns(Object.keys(props))
        }
        setResults(data.objects)
      } else {
        setResults([])
      }
      
      actions.setNotification(`Query executed successfully`, 'success')
    } else {
      setError(result.error)
    }
  }

  const handleExampleClick = (exampleQuery) => {
    setQuery(exampleQuery)
    setError(null)
    setResults(null)
  }

  const handleClear = () => {
    setQuery('')
    setResults(null)
    setError(null)
    setColumns([])
  }

  const handleCopyQuery = (q) => {
    navigator.clipboard.writeText(q)
    actions.setNotification('Query copied to clipboard', 'info')
  }

  const getPropertyValue = (item, key) => {
    // Handle different CMIS response formats
    const props = item.succinctProperties || item.properties || item.object?.succinctProperties || item.object?.properties || {}
    const value = props[key]
    
    if (value === null || value === undefined) return '-'
    if (typeof value === 'object' && value.value !== undefined) return String(value.value)
    return String(value)
  }

  if (!selectedRepo) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 3 }}>
          CMIS Query Console
        </Typography>
        <Alert severity="info">
          Please select a repository from the Repositories view to run queries.
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          CMIS Query Console
        </Typography>
        <Chip label={selectedRepo.displayName || selectedRepo.id} color="primary" size="small" />
      </Box>

      {/* Query Input */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Enter CMIS SQL Query
        </Typography>
        <TextField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          multiline
          rows={4}
          fullWidth
          placeholder="SELECT * FROM cmis:document WHERE cmis:name LIKE '%test%'"
          sx={{
            '& .MuiInputBase-input': {
              fontFamily: sapMonoFontFamily,
              fontSize: 14,
            },
          }}
        />
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<SapIcon name="media-play" />}
            onClick={handleRunQuery}
            disabled={loading || !query.trim()}
          >
            Run Query
          </Button>
          <Button
            variant="outlined"
            startIcon={<SapIcon name="clear-all" />}
            onClick={handleClear}
            disabled={loading}
          >
            Clear
          </Button>
        </Box>
      </Paper>

      {/* Example Queries */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Example Queries
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {EXAMPLE_QUERIES.map((example) => (
            <Tooltip key={example.name} title={example.query}>
              <Chip
                label={example.name}
                variant="outlined"
                onClick={() => handleExampleClick(example.query)}
                onDelete={() => handleCopyQuery(example.query)}
                deleteIcon={<SapIcon name="copy" fontSize="small" />}
                sx={{ cursor: 'pointer' }}
              />
            </Tooltip>
          ))}
        </Box>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Results Display */}
      {results !== null && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Results ({results.length} rows)
            </Typography>
          </Box>

          {results.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No results found
            </Typography>
          ) : (
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {columns.map((col) => (
                      <TableCell key={col}>
                        <Typography variant="body2" fontWeight={600} fontSize={12}>
                          {col}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((row, rowIndex) => {
                    const rowId = getPropertyValue(row, 'cmis:objectId') || `row-${rowIndex}`
                    return (
                      <TableRow key={rowId} hover>
                        {columns.map((col) => (
                          <TableCell key={col}>
                            <Typography 
                              variant="body2" 
                              fontSize={12}
                              sx={{ 
                                maxWidth: 300, 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {getPropertyValue(row, col)}
                            </Typography>
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}
    </Box>
  )
}

export default QueryEditor
