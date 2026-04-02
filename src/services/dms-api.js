// DMS API Service - Uses IPC to make requests via main process (avoids CORS)

class DMSApiService {
  
  async request(method, path, options = {}) {
    const result = await window.electronAPI.apiRequest({
      method,
      path,
      data: options.data,
      params: options.params,
      responseType: options.responseType,
    })

    if (!result.success) {
      throw new Error(result.error)
    }

    return result.data
  }

  // ============================================
  // Repository Operations
  // ============================================

  async listRepositories() {
    return this.request('GET', '/browser')
  }

  async listRepositoriesRest() {
    return this.request('GET', '/rest/v2/repositories')
  }

  async createRepository(repositoryData) {
    return this.request('POST', '/rest/v2/repositories/', {
      data: { repository: repositoryData },
    })
  }

  async deleteRepository(repoId) {
    return this.request('DELETE', `/rest/v2/repositories/${repoId}`)
  }

  async deleteAllRepositories() {
    return this.request('DELETE', '/rest/v2/repositories/')
  }

  // ============================================
  // Document/Folder Navigation
  // ============================================

  async listRootDocuments(repoId, filter = null) {
    const params = {}
    if (filter) params.filter = filter
    return this.request('GET', `/browser/${repoId}/root`, { params })
  }

  async listChildren(repoId, objectId, filter = null) {
    const params = {
      objectId,
      cmisselector: 'children',
    }
    if (filter) params.filter = filter
    return this.request('GET', `/browser/${repoId}/root`, { params })
  }

  async listChildrenByPath(repoId, path = '') {
    const encodedPath = path ? `/${encodeURIComponent(path)}` : ''
    return this.request('GET', `/browser/${repoId}/root${encodedPath}`)
  }

  async getProperties(repoId, objectId, filter = null) {
    const params = {
      objectId,
      cmisselector: 'properties',
    }
    if (filter) params.filter = filter
    return this.request('GET', `/browser/${repoId}/root`, { params })
  }

  // ============================================
  // Folder Operations
  // ============================================

  async createFolder(repoId, parentPath, folderName) {
    const formData = new URLSearchParams()
    formData.append('cmisaction', 'createFolder')
    formData.append('propertyId[0]', 'cmis:objectTypeId')
    formData.append('propertyValue[0]', 'cmis:folder')
    formData.append('propertyId[1]', 'cmis:name')
    formData.append('propertyValue[1]', folderName)
    formData.append('succinct', 'true')

    const encodedPath = parentPath ? `/${encodeURIComponent(parentPath)}` : ''
    
    return this.request('POST', `/browser/${repoId}/root${encodedPath}`, {
      data: formData.toString(),
    })
  }

  // ============================================
  // Document Operations
  // ============================================

  async uploadDocument(repoId, parentPath, fileName, fileBuffer, documentName = null) {
    const result = await window.electronAPI.apiUpload({
      repoId,
      parentPath,
      fileName,
      fileBuffer,
      documentName,
    })

    if (!result.success) {
      throw new Error(result.error)
    }

    return result.data
  }

  async downloadDocument(repoId, objectId) {
    return this.request('GET', `/browser/${repoId}/root`, {
      params: {
        objectId,
        cmisselector: 'content',
      },
      responseType: 'arraybuffer',
    })
  }

  async updateObject(repoId, objectId, properties) {
    const formData = new URLSearchParams()
    formData.append('cmisaction', 'update')
    formData.append('objectId', objectId)

    let index = 0
    for (const [key, value] of Object.entries(properties)) {
      formData.append(`propertyId[${index}]`, key)
      formData.append(`propertyValue[${index}]`, value)
      index++
    }

    return this.request('POST', `/browser/${repoId}/root`, {
      data: formData.toString(),
    })
  }

  async moveObject(repoId, objectId, sourceFolderId, targetFolderId) {
    const formData = new URLSearchParams()
    formData.append('cmisaction', 'move')
    formData.append('objectId', objectId)
    formData.append('sourceFolderId', sourceFolderId)
    formData.append('targetFolderId', targetFolderId)

    return this.request('POST', `/browser/${repoId}/root`, {
      data: formData.toString(),
    })
  }

  async deleteObject(repoId, objectId, allVersions = true) {
    const formData = new URLSearchParams()
    formData.append('cmisaction', 'delete')
    formData.append('objectId', objectId)
    formData.append('allVersions', allVersions.toString())

    return this.request('POST', `/browser/${repoId}/root/`, {
      data: formData.toString(),
    })
  }

  // ============================================
  // CMIS Query
  // ============================================

  async executeQuery(repoId, query) {
    return this.request('GET', `/browser/${repoId}`, {
      params: {
        cmisSelector: 'query',
        q: query,
      },
    })
  }
}

const dmsApi = new DMSApiService()

export default dmsApi
