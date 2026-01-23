import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RiEye2Line, RiEyeCloseLine } from 'react-icons/ri'
import genesisLogo from '../assets/Genesis_Sign_Violet.png'
import genesisText from '../assets/Genesis_Horizontal_Violet.png'
import authService from '../services/auth.service'
import '../css/Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeneralError('')
    setFieldErrors({ email: '', password: '' })
    
    let hasErrors = false
    const newFieldErrors = { email: '', password: '' }

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

    if (hasErrors) {
      setFieldErrors(newFieldErrors)
      return
    }

    setIsLoading(true)

    try {
      await authService.login(email, password)
      // Disparar evento personalizado para actualizar el estado
      window.dispatchEvent(new Event('authChange'))
      navigate('/')
    } catch (err) {
      // Errores del servidor son generales (credenciales inválidas, etc.)
      setGeneralError(err.message || 'Error al iniciar sesión')
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
          <h1 className="auth-title">Iniciar Sesión</h1>

          {generalError && <div className="error-message">{generalError}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
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

            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <p className="auth-footer">
            ¿No tienes cuenta? <Link to="/register" className="auth-link">Regístrate</Link>
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

export default Login
