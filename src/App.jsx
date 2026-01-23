import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import './css/App.css'
import Chat from './components/Chat'
import Login from './components/Login'
import Register from './components/Register'
import authService from './services/auth.service'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Verificar si el usuario está autenticado al cargar la app
  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated())

    // Escuchar eventos personalizados de cambio de autenticación
    const handleAuthChange = () => {
      setIsAuthenticated(authService.isAuthenticated())
    }

    window.addEventListener('authChange', handleAuthChange)

    return () => {
      window.removeEventListener('authChange', handleAuthChange)
    }
  }, [])

  return (
    <Routes>
      <Route path="/" element={<Chat isAuthenticated={isAuthenticated} />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  )
}

export default App
