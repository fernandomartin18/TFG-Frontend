import authService from './auth.service'

// Función helper para hacer fetch con autenticación automática
async function fetchWithAuth(url, options = {}) {
  // Obtener el token de acceso
  let token = authService.getAccessToken()

  // Configurar headers
  const headers = {
    ...options.headers,
  }

  // Si no es FormData, agregar Content-Type
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Primera petición
  let response = await fetch(url, {
    ...options,
    headers,
  })

  // Si el token expiró (401), intentar refrescar
  if (response.status === 401 && authService.getRefreshToken()) {
    try {
      // Refrescar el token
      token = await authService.refreshToken()

      // Reintentar la petición con el nuevo token
      headers['Authorization'] = `Bearer ${token}`
      response = await fetch(url, {
        ...options,
        headers,
      })
    } catch (error) {
      // Si falla el refresh, cerrar sesión
      authService.clearAuthData()
      window.dispatchEvent(new Event('authChange'))
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
    }
  }

  return response
}

export { fetchWithAuth }
