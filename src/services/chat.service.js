import { fetchWithAuth } from './api.service'

const API_URL = 'http://localhost:3000/api'

class ChatService {
  /**
   * Obtener todos los chats del usuario autenticado
   */
  async getUserChats() {
    const response = await fetchWithAuth(`${API_URL}/chats`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al obtener chats')
    }

    return data.chats
  }

  /**
   * Obtener un chat específico con todos sus mensajes
   */
  async getChatById(chatId) {
    const response = await fetchWithAuth(`${API_URL}/chats/${chatId}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al obtener chat')
    }

    return data.chat
  }

  /**
   * Crear un nuevo chat
   */
  async createChat(title = 'Nuevo Chat') {
    const response = await fetchWithAuth(`${API_URL}/chats`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al crear chat')
    }

    return data.chat
  }

  /**
   * Actualizar el título de un chat
   */
  async updateChatTitle(chatId, title) {
    const response = await fetchWithAuth(`${API_URL}/chats/${chatId}`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al actualizar chat')
    }

    return data.chat
  }

  /**
   * Eliminar un chat
   */
  async deleteChat(chatId) {
    const response = await fetchWithAuth(`${API_URL}/chats/${chatId}`, {
      method: 'DELETE',
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al eliminar chat')
    }

    return data
  }

  /**
   * Fijar o desfijar un chat
   */
  async togglePinChat(chatId, pinned) {
    const response = await fetchWithAuth(`${API_URL}/chats/${chatId}/pin`, {
      method: 'PATCH',
      body: JSON.stringify({ pinned }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al fijar/desfijar chat')
    }

    return data.chat
  }

  /**
   * Crear un mensaje en un chat
   */
  async createMessage(chatId, role, content, isError = false, isCollapsible = false, images = []) {
    const response = await fetchWithAuth(`${API_URL}/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ role, content, isError, isCollapsible, images }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Error en respuesta:', data)
      throw new Error(data.error || data.message || 'Error al crear mensaje')
    }

    return data.data
  }

  /**
   * Obtener mensajes de un chat
   */
  async getMessages(chatId) {
    const response = await fetchWithAuth(`${API_URL}/chats/${chatId}/messages`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al obtener mensajes')
    }

    return data.messages
  }

  /**
   * Crear código generado
   */
  async createCode(messageId, codeData) {
    const response = await fetchWithAuth(`${API_URL}/messages/${messageId}/codes`, {
      method: 'POST',
      body: JSON.stringify(codeData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al guardar código')
    }

    return data.code
  }

  /**
   * PROYECTOS
   */

  /**
   * Obtener todos los proyectos del usuario
   */
  async getUserProjects() {
    const response = await fetchWithAuth(`${API_URL}/projects`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al obtener proyectos')
    }

    return data
  }

  /**
   * Crear un nuevo proyecto
   */
  async createProject(name) {
    const response = await fetchWithAuth(`${API_URL}/projects`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al crear proyecto')
    }

    return data
  }

  /**
   * Actualizar nombre de un proyecto
   */
  async updateProjectName(projectId, name) {
    const response = await fetchWithAuth(`${API_URL}/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al actualizar proyecto')
    }

    return data
  }

  /**
   * Alternar estado expandido/colapsado del proyecto
   */
  async toggleProjectExpanded(projectId, isExpanded) {
    const response = await fetchWithAuth(`${API_URL}/projects/${projectId}/toggle-expand`, {
      method: 'PATCH',
      body: JSON.stringify({ isExpanded }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al cambiar estado del proyecto')
    }

    return data
  }

  /**
   * Eliminar un proyecto
   */
  async deleteProject(projectId) {
    const response = await fetchWithAuth(`${API_URL}/projects/${projectId}`, {
      method: 'DELETE',
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al eliminar proyecto')
    }

    return data
  }

  /**
   * Agregar un chat a un proyecto
   */
  async addChatToProject(chatId, projectId) {
    const response = await fetchWithAuth(`${API_URL}/projects/add-chat`, {
      method: 'POST',
      body: JSON.stringify({ chatId, projectId }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al agregar chat al proyecto')
    }

    return data
  }

  /**
   * Quitar un chat de un proyecto
   */
  async removeChatFromProject(chatId) {
    const response = await fetchWithAuth(`${API_URL}/projects/remove-chat/${chatId}`, {
      method: 'DELETE',
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al quitar chat del proyecto')
    }

    return data
  }
}

export default new ChatService()
