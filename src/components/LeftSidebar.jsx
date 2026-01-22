import PropTypes from 'prop-types'
import genesisLogo from '../assets/Genesis_Sign_Violet.png'
import genesisHorizontal from '../assets/Genesis_Horizontal_Violet.png'
import '../css/LeftSidebar.css'

function LeftSidebar({ isOpen, setIsOpen }) {
  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const handleLogin = () => {
    // Función para manejar el inicio de sesión
    console.log('Iniciar sesión')
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
          
          {/* Contenedor para el botón de inicio de sesión en la parte inferior */}
          <div className="sidebar-footer">
            <button className="login-button" onClick={handleLogin}>
              Iniciar sesión
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

LeftSidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired
}

export default LeftSidebar
