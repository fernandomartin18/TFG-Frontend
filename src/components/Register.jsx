import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RiEye2Line, RiEyeCloseLine } from 'react-icons/ri'
import genesisLogo from '../assets/Genesis_Sign_Violet.png'
import genesisText from '../assets/Genesis_Horizontal_Violet.png'
import authService from '../services/auth.service'
import '../css/Register.css'

function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeneralError('')
    setFieldErrors({ username: '', email: '', password: '', confirmPassword: '' })
    
    let hasErrors = false
    const newFieldErrors = { username: '', email: '', password: '', confirmPassword: '' }

    // Validar username
    if (username.length < 3) {
      newFieldErrors.username = 'Mínimo 3 caracteres'
      hasErrors = true
    } else if (username.length > 50) {
      newFieldErrors.username = 'Máximo 50 caracteres'
      hasErrors = true
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      newFieldErrors.username = 'Solo letras, números, guiones'
      hasErrors = true
    }

    // Validar email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newFieldErrors.email = 'Formato de email inválido'
      hasErrors = true
    }

    // Validar contraseña
    if (password.length < 6) {
      newFieldErrors.password = 'Mínimo 6 caracteres'
      hasErrors = true
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newFieldErrors.password = 'Debe incluir mayúscula, minúscula y número'
      hasErrors = true
    }

    // Validar confirmación de contraseña
    if (password !== confirmPassword) {
      newFieldErrors.confirmPassword = 'Las contraseñas no coinciden'
      hasErrors = true
    }

    if (hasErrors) {
      setFieldErrors(newFieldErrors)
      return
    }

    setIsLoading(true)
    
    try {
      await authService.register(username, email, password)
      // Disparar evento personalizado para actualizar el estado
      window.dispatchEvent(new Event('authChange'))
      navigate('/')
    } catch (err) {
      // Errores del servidor son generales
      setGeneralError(err.message || 'Error al registrar usuario')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      {/* Logo pequeño arriba a la izquierda */}
      <div className="top-logo">
        <img src={genesisText} alt="Genesis" />
      </div>

      {/* Mitad izquierda - Formulario */}
      <div className="auth-left">
        <div className="auth-card">
          <h1 className="auth-title">Crear Cuenta</h1>

          {generalError && <div className="error-message">{generalError}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Nombre</label>
              <div className="input-with-error">
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nombre"
                  disabled={isLoading}
                  className={fieldErrors.username ? 'input-error' : ''}
                />
                {fieldErrors.username && (
                  <div className="field-error-tooltip">{fieldErrors.username}</div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>
              <div className="input-with-error">
                <input
                  type="text"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  disabled={isLoading}
                  className={fieldErrors.email ? 'input-error' : ''}
                />
                {fieldErrors.email && (
                  <div className="field-error-tooltip">{fieldErrors.email}</div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <div className="input-with-error">
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className={fieldErrors.password ? 'input-error' : ''}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <RiEyeCloseLine /> : <RiEye2Line />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <div className="field-error-tooltip">{fieldErrors.password}</div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Repetir Contraseña</label>
              <div className="input-with-error">
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className={fieldErrors.confirmPassword ? 'input-error' : ''}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <RiEyeCloseLine /> : <RiEye2Line />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <div className="field-error-tooltip">{fieldErrors.confirmPassword}</div>
                )}
              </div>
            </div>

            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>

          <p className="auth-footer">
            ¿Ya tienes cuenta? <Link to="/login" className="auth-link">Inicia sesión</Link>
          </p>
        </div>
      </div>

      {/* Mitad derecha - Logo */}
      <div className="auth-right">
        <div className="logo-container">
          <img src={genesisLogo} alt="Genesis" className="logo-large" />
        </div>
      </div>
    </div>
  )
}

export default Register
