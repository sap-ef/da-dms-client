// Auth Service - Lightweight wrapper for auth operations via IPC

class AuthService {
  constructor() {
    this.serviceKey = null
  }

  setServiceKey(serviceKey) {
    this.serviceKey = serviceKey
  }

  getEndpoint() {
    if (this.serviceKey?.endpoints?.ecmservice?.url) {
      return this.serviceKey.endpoints.ecmservice.url
    }
    if (this.serviceKey?.uri) {
      return this.serviceKey.uri
    }
    return null
  }

  getAuthUrl() {
    return this.serviceKey?.uaa?.url
  }

  getClientId() {
    return this.serviceKey?.uaa?.clientid
  }

  isConfigured() {
    return !!(this.serviceKey && this.getEndpoint() && this.getAuthUrl())
  }

  async getConfig() {
    try {
      return await window.electronAPI.getAuthConfig()
    } catch {
      return {
        endpoint: this.getEndpoint(),
        authUrl: this.getAuthUrl(),
        clientId: this.getClientId(),
        hasToken: false,
        tokenExpiry: null,
      }
    }
  }

  async testConnection() {
    return await window.electronAPI.testConnection()
  }

  clearToken() {
    // Token is managed in main process
  }
}

const authService = new AuthService()

export default authService
