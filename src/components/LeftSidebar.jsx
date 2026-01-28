import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { RiChatNewLine } from 'react-icons/ri'
import genesisLogo from '../assets/Genesis_Sign_Violet.png'
import genesisHorizontal from '../assets/Genesis_Horizontal_Violet.png'
import UserProfile from './UserProfile'
import chatService from '../services/chat.service'
import '../css/LeftSidebar.css'

const LeftSidebar = forwardRef(({ isOpen, setIsOpen, isAuthenticated, isDarkTheme, onToggleTheme, onChatSelect, currentChatId, onNewChat, hasMessages }, ref) => {
  const navigate = useNavigate()
  const [chats, setChats] = useState([])
  const [isLoadingChats, setIsLoadingChats] = useState(false)

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const handleLogin = () => {
    navigate('/login')
  }

  // Cargar chats cuando el usuario esté autenticado
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      loadChats()
    }
  }, [isAuthenticated, isOpen])

  const loadChats = async () => {
    try {
      setIsLoadingChats(true)
      const userChats = await chatService.getUserChats()
      setChats(userChats)
    } catch (error) {
      console.error('Error al cargar chats:', error)
    } finally {
      setIsLoadingChats(false)
    }
  }

  const handleChatClick = (chatId) => {
    if (onChatSelect) {
      onChatSelect(chatId)
    }
  }

  // Exponer la función refreshChats al componente padre
  useImperativeHandle(ref, () => ({
    refreshChats: loadChats
  }))

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

        {/* Botón de nuevo chat cuando la barra está cerrada */}
        {isAuthenticated && !isOpen && (
          <button
            className="new-chat-button-compact"
            onClick={onNewChat}
            disabled={!hasMessages}
            aria-label="Crear nuevo chat"
          >
            <RiChatNewLine className="new-chat-icon-compact" />
          </button>
        )}

        <div className="left-sidebar-content">
          {/* Lista de chats */}
          {isAuthenticated && isOpen && (
            <div className="chats-list-container">
              {/* Botón de nuevo chat */}
              <button 
                className="new-chat-button"
                onClick={onNewChat}
                disabled={!hasMessages}
                aria-label="Crear nuevo chat"
              >
                <RiChatNewLine className="new-chat-icon" />
                <span>Nuevo chat</span>
              </button>

              <div className="chats-list">
                {isLoadingChats ? (
                  <div className="chats-loading">Cargando chats...</div>
                ) : chats.length === 0 ? (
                  <div className="chats-empty">No hay chats guardados</div>
                ) : (
                  chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`chat-item ${currentChatId === chat.id ? 'active' : ''}`}
                      onClick={() => handleChatClick(chat.id)}
                    >
                      <div className="chat-item-title">{chat.title}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          {/* Contenedor para el perfil o botón de inicio de sesión en la parte inferior */}
          <div className="sidebar-footer">
            {isAuthenticated ? (
              isOpen ? (
                <UserProfile 
                  isDarkTheme={isDarkTheme}
                  onToggleTheme={onToggleTheme}
                />
              ) : (
                <UserProfile 
                  isDarkTheme={isDarkTheme}
                  onToggleTheme={onToggleTheme}
                  compact={true}
                />
              )
            ) : (
              isOpen && (
                <button className="login-button" onClick={handleLogin}>
                  Iniciar sesión
                </button>
              )
            )}
          </div>
        </div>
      </aside>
    </>
  )
})

LeftSidebar.displayName = 'LeftSidebar'

LeftSidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool.isRequired,
  isDarkTheme: PropTypes.bool.isRequired,
  onToggleTheme: PropTypes.func.isRequired,
  onChatSelect: PropTypes.func,
  currentChatId: PropTypes.number,
  onNewChat: PropTypes.func,
  hasMessages: PropTypes.bool,
}

export default LeftSidebar
