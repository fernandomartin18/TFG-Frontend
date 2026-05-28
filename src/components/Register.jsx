import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RiEye2Line, RiEyeCloseLine } from 'react-icons/ri'
import genesisLogo from '../assets/Genesis_Sign_Violet.png'
import genesisText from '../assets/Genesis_Horizontal_Violet.png'
import authService from '../services/auth.service'
import '../css/Register.css'

function Register() {
  const { t } = useTranslation()
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

  useEffect(() => {
    const html = document.documentElement
    if (!html.dataset.theme) {
      const savedTheme = localStorage.getItem('theme')
      html.dataset.theme = savedTheme ||
        (globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeneralError('')
    setFieldErrors({ username: '', email: '', password: '', confirmPassword: '' })
    
    let hasErrors = false
    const newFieldErrors = { username: '', email: '', password: '', confirmPassword: '' }

    // Validar username
    if (username.length < 3) {
      newFieldErrors.username = t('auth.errors.minUsername')
      hasErrors = true
    } else if (username.length > 50) {
      newFieldErrors.username = t('auth.errors.maxUsername')
      hasErrors = true
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      newFieldErrors.username = t('auth.errors.invalidUsername')
      hasErrors = true
    }

    // Validar email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newFieldErrors.email = t('auth.errors.invalidEmail')
      hasErrors = true
    }

    // Validar contraseña
    if (password.length < 6) {
      newFieldErrors.password = t('auth.errors.minPassword')
      hasErrors = true
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newFieldErrors.password = t('auth.errors.passwordRequirements')
      hasErrors = true
    }

    // Validar confirmación de contraseña
    if (password !== confirmPassword) {
      newFieldErrors.confirmPassword = t('auth.errors.passwordsDoNotMatch')
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
      setGeneralError(err.message || t('auth.errors.registerError'))
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
          <h1 className="auth-title">{t('auth.register.title')}</h1>

          {generalError && <div className="error-message">{generalError}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">{t('auth.register.nameLabel')}</label>
              <div className="input-with-error">
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('auth.register.namePlaceholder')}
                  disabled={isLoading}
                  className={fieldErrors.username ? 'input-error' : ''}
                />
                {fieldErrors.username && (
                  <div className="field-error-tooltip">{fieldErrors.username}</div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">{t('auth.login.emailLabel')}</label>
              <div className="input-with-error">
                <input
                  type="text"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.login.emailPlaceholder')}
                  disabled={isLoading}
                  className={fieldErrors.email ? 'input-error' : ''}
                />
                {fieldErrors.email && (
                  <div className="field-error-tooltip">{fieldErrors.email}</div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('auth.login.passwordLabel')}</label>
              <div className="input-with-error">
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.login.passwordPlaceholder')}
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
              <label htmlFor="confirmPassword">{t('auth.register.confirmPasswordLabel')}</label>
              <div className="input-with-error">
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('auth.login.passwordPlaceholder')}
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
              {isLoading ? t('auth.register.submittingButton') : t('auth.register.submitButton')}
            </button>
          </form>

          <p className="auth-footer">
            {t('auth.register.alreadyHaveAccount')} <Link to="/login" className="auth-link">{t('auth.register.loginLink')}</Link>
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
