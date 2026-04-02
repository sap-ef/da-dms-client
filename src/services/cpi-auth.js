// CPI Auth Service - Lightweight wrapper for CPI auth operations via IPC

class CpiAuthService {
  constructor() {
    this.serviceKey = null
  }

  setServiceKey(serviceKey) {
    this.serviceKey = serviceKey
  }

  getEndpoint() {
    return this.serviceKey?.oauth?.url || this.serviceKey?.uaa?.url || ''
  }

  getTokenUrl() {
    return this.serviceKey?.oauth?.tokenurl || this.serviceKey?.uaa?.tokenurl
  }

  getClientId() {
    return this.serviceKey?.oauth?.clientid || this.serviceKey?.uaa?.clientid
  }

  isConfigured() {
    return !!(this.serviceKey && this.getTokenUrl())
  }

  async getConfig() {
    try {
      return await window.electronAPI.getCpiAuthConfig()
    } catch {
      return {
        endpoint: this.getEndpoint(),
        tokenUrl: this.getTokenUrl(),
        clientId: this.getClientId(),
        hasToken: false,
        tokenExpiry: null,
      }
    }
  }
}

const cpiAuthService = new CpiAuthService()

export default cpiAuthService
