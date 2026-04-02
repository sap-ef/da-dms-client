import React, { useState, useEffect } from 'react'
import { sapMonoFontFamily } from '../../styles/theme'
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Grid,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import SapIcon from '../SapIcon'
import { useApp } from '../../context/AppContext'

function SettingsView() {
  const { state, actions } = useApp()
  const { isConfigured, authConfig, loading, cpiIsConfigured, cpiAuthConfig } = state

  const [activeTab, setActiveTab] = useState(0)

  // DMS state
  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting] = useState(false)
  const [tokenResult, setTokenResult] = useState(null)
  const [requestingToken, setRequestingToken] = useState(false)

  // CPI state
  const [cpiTestResult, setCpiTestResult] = useState(null)
  const [cpiTesting, setCpiTesting] = useState(false)
  const [archivingConfirmOpen, setArchivingConfirmOpen] = useState(false)
  const [archivingResult, setArchivingResult] = useState(null)
  const [activating, setActivating] = useState(false)


  // DMS handlers
  const handleLoadServiceKey = async () => {
    try {
      const result = await window.electronAPI.loadServiceKeyFile()
      if (result.success) {
        await actions.configureAuth(result.data)
        actions.setNotification('Service key loaded successfully', 'success')
      } else if (result.error !== 'File selection canceled') {
        actions.setNotification(result.error, 'error')
      }
    } catch (error) {
      actions.setNotification(`Failed to load service key: ${error.message}`, 'error')
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)

    const result = await actions.testConnection()
    setTestResult(result)
    setTesting(false)

    if (result.success) {
      actions.setNotification('Connection successful!', 'success')
    } else {
      actions.setNotification(`Connection failed: ${result.error}`, 'error')
    }
  }

  const handleRequestToken = async () => {
    setRequestingToken(true)
    setTokenResult(null)

    try {
      const result = await window.electronAPI.requestToken()
      setTokenResult(result)

      if (result.success) {
        actions.setNotification('Token acquired successfully!', 'success')
      } else {
        actions.setNotification(`Failed to request token: ${result.error}`, 'error')
      }
    } catch (error) {
      const errorMsg = error.message || 'Unknown error'
      setTokenResult({ success: false, error: errorMsg })
      actions.setNotification(`Error requesting token: ${errorMsg}`, 'error')
    } finally {
      setRequestingToken(false)
    }
  }

  const handleClearConfig = async () => {
    await actions.clearAuth()
    setTestResult(null)
    actions.setNotification('Configuration cleared', 'info')
  }

  const handleCopyToken = async () => {
    if (tokenResult?.success && tokenResult?.token) {
      try {
        await navigator.clipboard.writeText(tokenResult.token)
        actions.setNotification('Token copied to clipboard!', 'success')
      } catch (error) {
        actions.setNotification('Failed to copy token', 'error')
      }
    }
  }

  // CPI handlers
  const handleLoadCpiServiceKey = async () => {
    try {
      const result = await window.electronAPI.loadCpiServiceKeyFile()
      if (result.success) {
        await actions.configureCpiAuth(result.data)
        actions.setNotification('Cloud Integration service key loaded successfully', 'success')
      } else if (result.error !== 'File selection canceled') {
        actions.setNotification(result.error, 'error')
      }
    } catch (error) {
      actions.setNotification(`Failed to load Cloud Integration service key: ${error.message}`, 'error')
    }
  }

  const handleTestCpiConnection = async () => {
    setCpiTesting(true)
    setCpiTestResult(null)

    const result = await actions.testCpiConnection()
    setCpiTestResult(result)
    setCpiTesting(false)

    if (result.success) {
      actions.setNotification('Cloud Integration connection successful!', 'success')
    } else {
      actions.setNotification(`Cloud Integration connection failed: ${result.error}`, 'error')
    }
  }

  const handleClearCpiConfig = async () => {
    await actions.clearCpiAuth()
    setCpiTestResult(null)
    actions.setNotification('Cloud Integration configuration cleared', 'info')
  }

  const handleActivateArchiving = async () => {
    setArchivingConfirmOpen(false)
    setActivating(true)
    setArchivingResult(null)

    try {
      const result = await window.electronAPI.activateCpiArchiving()
      setArchivingResult(result)
      if (result.success) {
        actions.setNotification('Data archiving activated successfully!', 'success')
      } else {
        actions.setNotification(`Activation failed: ${result.error}`, 'error')
      }
    } catch (error) {
      const res = { success: false, error: error.message }
      setArchivingResult(res)
      actions.setNotification(`Activation error: ${error.message}`, 'error')
    } finally {
      setActivating(false)
    }
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Settings
      </Typography>

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="DMS" />
        <Tab label="Cloud Integration" />
      </Tabs>

      {/* DMS Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
          <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
            <Paper sx={{ p: 3, width: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Service Key Configuration
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Load your SAP DMS service key JSON file exported from the BTP Cockpit.
                The credentials will be stored securely on your machine.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<SapIcon name="upload" />}
                  onClick={handleLoadServiceKey}
                  disabled={loading}
                >
                  Load Service Key
                </Button>

                {isConfigured && (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={testing ? <CircularProgress size={20} /> : <SapIcon name="refresh" />}
                      onClick={handleTestConnection}
                      disabled={testing || loading}
                    >
                      Test Connection
                    </Button>

                    <Button
                      variant="outlined"
                      startIcon={requestingToken ? <CircularProgress size={20} /> : <SapIcon name="key" />}
                      onClick={handleRequestToken}
                      disabled={requestingToken || loading}
                    >
                      Request Token
                    </Button>

                    <Tooltip title="Clear configuration">
                      <IconButton
                        color="error"
                        aria-label="Clear configuration"
                        onClick={handleClearConfig}
                        disabled={loading}
                      >
                        <SapIcon name="delete" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>

              {testResult && (
                <Alert
                  severity={testResult.success ? 'success' : 'error'}
                  sx={{ mt: 2 }}
                >
                  {testResult.success
                    ? 'Successfully authenticated with DMS API!'
                    : testResult.error}
                </Alert>
              )}

              {tokenResult && (
                <Paper
                  variant="outlined"
                  sx={{ mt: 2, p: 2, bgcolor: 'background.default' }}
                >
                  {tokenResult.success ? (
                    <Box>
                      <Alert severity="success" sx={{ mb: 2 }}>
                        Token acquired successfully!
                      </Alert>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Expires in:</strong> {tokenResult.expiresIn} seconds
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2, wordBreak: 'break-all' }}>
                        <strong>Expiry time:</strong> {new Date(tokenResult.expiryTime).toLocaleString()}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<SapIcon name="copy" />}
                          onClick={handleCopyToken}
                        >
                          Copy Token
                        </Button>
                        <Typography variant="caption" color="text.secondary">
                          Click to copy the full token to your clipboard
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Alert severity="error">
                      {tokenResult.error}
                    </Alert>
                  )}
                </Paper>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
            <Paper sx={{ p: 3, width: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Current Configuration
              </Typography>

              {isConfigured && authConfig ? (
                <Box>
                  <ConfigItem label="Endpoint" value={authConfig.endpoint} />
                  <ConfigItem label="Auth URL" value={authConfig.authUrl} />
                  <ConfigItem label="Client ID" value={authConfig.clientId} masked />
                  <ConfigItem
                    label="Token Status"
                    value={authConfig.hasToken ? 'Active' : 'Not acquired'}
                    status={authConfig.hasToken}
                  />
                  {authConfig.tokenExpiry && (
                    <ConfigItem label="Token Expiry" value={authConfig.tokenExpiry} />
                  )}
                </Box>
              ) : (
                <Alert severity="warning">
                  No service key configured. Please load a service key to get started.
                </Alert>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                How to Get Your Service Key
              </Typography>

              <Box component="ol" sx={{ pl: 2, '& li': { mb: 1 } }}>
                <li>
                  <Typography variant="body2">
                    Go to your SAP BTP Cockpit and navigate to your subaccount
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Find the Document Management Service instance in Services &gt; Instances
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Create a service key if you don't have one already
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Download the service key JSON file
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Use the "Load Service Key" button above to import it
                  </Typography>
                </li>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Cloud Integration Tab */}
      {activeTab === 1 && (
        <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
          <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
            <Paper sx={{ p: 3, width: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Cloud Integration Service Key Configuration
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Load your SAP Cloud Integration service key JSON file exported from the BTP Cockpit.
                This is used to authenticate with the Cloud Integration runtime for data archiving.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<SapIcon name="upload" />}
                  onClick={handleLoadCpiServiceKey}
                  disabled={loading}
                >
                  Load Service Key
                </Button>

                {cpiIsConfigured && (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={cpiTesting ? <CircularProgress size={20} /> : <SapIcon name="refresh" />}
                      onClick={handleTestCpiConnection}
                      disabled={cpiTesting || loading}
                    >
                      Test Connection
                    </Button>

                    <Tooltip title="Clear Cloud Integration configuration">
                      <IconButton
                        color="error"
                        aria-label="Clear Cloud Integration configuration"
                        onClick={handleClearCpiConfig}
                        disabled={loading}
                      >
                        <SapIcon name="delete" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>

              {cpiTestResult && (
                <Alert
                  severity={cpiTestResult.success ? 'success' : 'error'}
                  sx={{ mt: 2 }}
                >
                  {cpiTestResult.success
                    ? 'Successfully authenticated with Cloud Integration!'
                    : cpiTestResult.error}
                </Alert>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
            <Paper sx={{ p: 3, width: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Current Cloud Integration Configuration
              </Typography>

              {cpiIsConfigured && cpiAuthConfig ? (
                <Box>
                  <ConfigItem label="Runtime URL" value={cpiAuthConfig.endpoint} />
                  <ConfigItem label="Token URL" value={cpiAuthConfig.tokenUrl} />
                  <ConfigItem label="Client ID" value={cpiAuthConfig.clientId} masked />
                  <ConfigItem
                    label="Token Status"
                    value={cpiAuthConfig.hasToken ? 'Active' : 'Not acquired'}
                    status={cpiAuthConfig.hasToken}
                  />
                </Box>
              ) : (
                <Alert severity="warning">
                  No Cloud Integration service key configured. Please load a service key to get started.
                </Alert>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Activate Data Archiving
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Activate the data archiving configuration on your SAP Cloud Integration tenant.
                Make sure the <strong>CloudIntegration_LogArchive</strong> destination has been created
                in your BTP subaccount before activating.
              </Typography>

              <Button
                variant="contained"
                color="primary"
                onClick={() => setArchivingConfirmOpen(true)}
                disabled={!cpiIsConfigured || activating || loading}
                startIcon={activating ? <CircularProgress size={20} /> : null}
              >
                {activating ? 'Activating...' : 'Activate Data Archiving'}
              </Button>

              {archivingResult && (
                <Alert
                  severity={archivingResult.success ? 'success' : 'error'}
                  sx={{ mt: 2 }}
                >
                  {archivingResult.success ? archivingResult.message : archivingResult.error}
                </Alert>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                How to Set Up Cloud Integration Data Archiving
              </Typography>

              <Box component="ol" sx={{ pl: 2, '& li': { mb: 1 } }}>
                <li>
                  <Typography variant="body2">
                    Go to your SAP BTP Cockpit and navigate to your subaccount
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Find the SAP Cloud Integration instance in Services &gt; Instances
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Create a service key with the required scopes for data archiving
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Download the service key JSON file and load it above
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Use the "Activate Data Archiving" button to enable archiving on your tenant
                  </Typography>
                </li>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Archiving Confirmation Dialog */}
      <Dialog
        open={archivingConfirmOpen}
        onClose={() => setArchivingConfirmOpen(false)}
      >
        <DialogTitle>Activate Data Archiving</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Before activating data archiving, please confirm that the
            <strong> CloudIntegration_LogArchive </strong>
            destination has been created in your BTP subaccount.
          </Typography>
          <Alert severity="warning">
            The destination must exist and be properly configured before calling
            the activation API. Without it, the activation will fail.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchivingConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleActivateArchiving}
          >
            Yes, Destination is Created
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

function ConfigItem({ label, value, masked = false, status = null }) {
  const displayValue = masked ? `${value?.substring(0, 8)}...` : value

  return (
    <Box sx={{ display: 'flex', py: 1, borderBottom: 1, borderColor: 'divider' }}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ width: 120, flexShrink: 0 }}
      >
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {status !== null && (
          <SapIcon
            name="accept"
            fontSize="small"
            color={status ? 'success' : 'disabled'}
          />
        )}
        <Typography
          variant="body2"
          sx={{
            wordBreak: 'break-all',
            fontFamily: sapMonoFontFamily,
            fontSize: 12,
          }}
        >
          {displayValue || '-'}
        </Typography>
      </Box>
    </Box>
  )
}

export default SettingsView
