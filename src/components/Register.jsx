import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RiEye2Line, RiEyeCloseLine } from 'react-icons/ri'
import genesisLogo from '../assets/Genesis_Sign_Violet.png'
import genesisText from '../assets/Genesis_Horizontal_Violet.png'
import '../css/Register.css'

function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden')
      return
    }
    
    // Por ahora solo simula el registro
    localStorage.setItem('isAuthenticated', 'true')
    // Disparar evento personalizado para actualizar el estado
    window.dispatchEvent(new Event('authChange'))
    navigate('/')
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

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Nombre</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <RiEyeCloseLine /> : <RiEye2Line />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Repetir Contraseña</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <RiEyeCloseLine /> : <RiEye2Line />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-button">
              Registrarse
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
