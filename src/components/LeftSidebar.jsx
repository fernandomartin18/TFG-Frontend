import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import genesisLogo from '../assets/Genesis_Sign_Violet.png'
import genesisHorizontal from '../assets/Genesis_Horizontal_Violet.png'
import UserProfile from './UserProfile'
import '../css/LeftSidebar.css'

function LeftSidebar({ isOpen, setIsOpen, isAuthenticated }) {
  const navigate = useNavigate()

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const handleLogin = () => {
    navigate('/login')
  }

  return (
    <>
      {/* Panel lateral */}
      <aside className={`left-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Botón de toggle */}
        <button
          className={`left-sidebar-toggle-button ${isOpen ? 'open' : ''}`}
          onClick={toggleSidebar}
          aria-label={isOpen ? 'Cerrar panel' : 'Abrir panel'}
        >
          <img 
            src={isOpen ? genesisHorizontal : genesisLogo} 
            alt="Genesis" 
            className={`toggle-icon ${isOpen ? 'horizontal' : ''}`} 
          />
        </button>

        <div className="left-sidebar-content">
          
          {/* Contenedor para el perfil o botón de inicio de sesión en la parte inferior */}
          <div className="sidebar-footer">
            {isAuthenticated ? (
              <UserProfile />
            ) : (
              <button className="login-button" onClick={handleLogin}>
                Iniciar sesión
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

LeftSidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool.isRequired
}

export default LeftSidebar
