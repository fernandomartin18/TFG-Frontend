const API_URL = 'http://localhost:3000/api/auth'

class AuthService {
  // Registrar nuevo usuario
  async register(username, email, password) {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al registrar usuario')
    }

    // Guardar tokens y datos del usuario
    if (data.accessToken) {
      this.setTokens(data.accessToken, data.refreshToken)
      this.setUser(data.user)
    }

    return data
  }

  // Iniciar sesión
  async login(email, password) {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al iniciar sesión')
    }

    // Guardar tokens y datos del usuario
    if (data.accessToken) {
      this.setTokens(data.accessToken, data.refreshToken)
      this.setUser(data.user)
    }

    return data
  }

  // Cerrar sesión
  async logout() {
    const token = this.getAccessToken()
    
    if (token) {
      try {
        await fetch(`${API_URL}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      } catch (error) {
        console.error('Error al cerrar sesión en el servidor:', error)
      }
    }

    // Limpiar datos locales
    this.clearAuthData()
  }

  // Refrescar el access token
  async refreshToken() {
    const refreshToken = this.getRefreshToken()

    if (!refreshToken) {
      throw new Error('No hay refresh token')
    }

    const response = await fetch(`${API_URL}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    const data = await response.json()

    if (!response.ok) {
      this.clearAuthData()
      throw new Error(data.error || 'Error al refrescar token')
    }

    // Actualizar tokens
    this.setTokens(data.accessToken, data.refreshToken)

    return data.accessToken
  }

  // Guardar tokens
  setTokens(accessToken, refreshToken) {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('isAuthenticated', 'true')
  }

  // Guardar datos del usuario
  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user))
  }

  // Obtener access token
  getAccessToken() {
    return localStorage.getItem('accessToken')
  }

  // Obtener refresh token
  getRefreshToken() {
    return localStorage.getItem('refreshToken')
  }

  // Obtener datos del usuario
  getUser() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  }

  // Verificar si está autenticado
  isAuthenticated() {
    return localStorage.getItem('isAuthenticated') === 'true' && this.getAccessToken() !== null
  }

  // Limpiar datos de autenticación
  clearAuthData() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')
  }
}

export default new AuthService()
