import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { RiChatNewLine } from 'react-icons/ri'
import { IoSearch } from "react-icons/io5"
import { MdKeyboardArrowDown, MdEdit } from 'react-icons/md'
import { FaFolderPlus, FaTrash } from 'react-icons/fa'
import genesisLogo from '../assets/Genesis_Sign_Violet.png'
import genesisHorizontal from '../assets/Genesis_Horizontal_Violet.png'
import UserProfile from './UserProfile'
import ChatOptionsMenu from './ChatOptionsMenu'
import ProjectSelector from './ProjectSelector'
import ProjectModal from './ProjectModal'
import chatService from '../services/chat.service'
import '../css/LeftSidebar.css'

const LeftSidebar = forwardRef(({ isOpen, setIsOpen, isAuthenticated, isDarkTheme, onToggleTheme, onChatSelect, currentChatId, onNewChat, hasMessages, isLoading }, ref) => {
  const navigate = useNavigate()
  const [chats, setChats] = useState([])
  const [projects, setProjects] = useState([])
  const [isLoadingChats, setIsLoadingChats] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredChats, setFilteredChats] = useState([])
  const [showProjectSelector, setShowProjectSelector] = useState(false)
  const [selectorPosition, setSelectorPosition] = useState(null)
  const [selectedChatForProject, setSelectedChatForProject] = useState(null)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [projectModalMode, setProjectModalMode] = useState('create') // 'create' | 'edit'
  const [editingProject, setEditingProject] = useState(null)
  const [projectContextMenu, setProjectContextMenu] = useState(null)
  const searchInputRef = useRef(null)
  const projectContextMenuRef = useRef(null)

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
      loadProjects()
    }
  }, [isAuthenticated, isOpen])

  const loadChats = async () => {
    try {
      setIsLoadingChats(true)
      const userChats = await chatService.getUserChats()
      setChats(userChats)
      setFilteredChats(userChats)
    } catch (error) {
      console.error('Error al cargar chats:', error)
    } finally {
      setIsLoadingChats(false)
    }
  }

  const loadProjects = async () => {
    try {
      const userProjects = await chatService.getUserProjects()
      setProjects(userProjects)
    } catch (error) {
      console.error('Error al cargar proyectos:', error)
    }
  }

  // Filtrar chats cuando cambia la búsqueda
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChats(chats)
      return
    }

    const query = searchQuery.toLowerCase().trim()
    
    // Intentar parsear como fecha
    const possibleDate = parseDateQuery(query)
    
    const filtered = chats.filter(chat => {
      // Filtrar por título
      if (chat.title.toLowerCase().includes(query)) {
        return true
      }
      
      // Filtrar por fecha si se detectó una fecha válida
      if (possibleDate) {
        const chatDate = new Date(chat.updated_at)
        return isSameDay(chatDate, possibleDate)
      }
      
      return false
    })
    
    setFilteredChats(filtered)
  }, [searchQuery, chats])

  // Cerrar menú contextual de proyecto si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (projectContextMenu && projectContextMenuRef.current && !projectContextMenuRef.current.contains(e.target)) {
        setProjectContextMenu(null)
      }
    }

    if (projectContextMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [projectContextMenu])

  // Función para parsear diferentes formatos de fecha
  const parseDateQuery = (query) => {
    // Intentar varios formatos de fecha
    const formats = [
      // DD/MM/YYYY o DD-MM-YYYY
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/,
      // DD/MM o DD-MM (año actual)
      /^(\d{1,2})[/-](\d{1,2})$/,
      // YYYY-MM-DD
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    ]
    
    for (const format of formats) {
      const match = query.match(format)
      if (match) {
        let day, month, year
        
        if (match[0].startsWith(match[1]) && match[1].length === 4) {
          // Formato YYYY-MM-DD
          year = parseInt(match[1])
          month = parseInt(match[2]) - 1
          day = parseInt(match[3])
        } else if (match.length === 3) {
          // Formato DD/MM (año actual)
          day = parseInt(match[1])
          month = parseInt(match[2]) - 1
          year = new Date().getFullYear()
        } else {
          // Formato DD/MM/YYYY
          day = parseInt(match[1])
          month = parseInt(match[2]) - 1
          year = parseInt(match[3])
        }
        
        const date = new Date(year, month, day)
        if (!isNaN(date.getTime())) {
          return date
        }
      }
    }
    
    return null
  }

  // Función para comparar si dos fechas son el mismo día
  const isSameDay = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen)
    if (!isSearchOpen) {
      // Enfocar el input cuando se abre
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }, 100)
    } else {
      // Limpiar búsqueda al cerrar
      setSearchQuery('')
    }
  }

  const handleChatClick = (chatId) => {
    // No permitir cambiar de chat si la IA está respondiendo
    if (isLoading) {
      return
    }
    
    if (onChatSelect) {
      onChatSelect(chatId)
    }
  }

  const handleEditChat = async (chatId, newTitle) => {
    try {
      await chatService.updateChatTitle(chatId, newTitle)
      await loadChats()
      await loadProjects()
    } catch (error) {
      console.error('Error al editar chat:', error)
    }
  }

  const handleTogglePin = async (chatId, pinned) => {
    try {
      await chatService.togglePinChat(chatId, pinned)
      await loadChats()
      await loadProjects()
    } catch (error) {
      console.error('Error al fijar/desfijar chat:', error)
    }
  }

  const handleDeleteChat = async (chatId) => {
    try {
      await chatService.deleteChat(chatId)
      await loadChats()
      await loadProjects()
      // Si era el chat actual, iniciar un nuevo chat
      if (currentChatId === chatId) {
        if (onNewChat) {
          onNewChat()
        } else if (onChatSelect) {
          onChatSelect(null)
        }
      }
    } catch (error) {
      console.error('Error al eliminar chat:', error)
    }
  }

  // Funciones de proyectos
  const handleAddToProject = (chatId, position) => {
    setSelectedChatForProject(chatId)
    setSelectorPosition(position)
    setShowProjectSelector(true)
  }

  const handleRemoveFromProject = async (chatId) => {
    try {
      await chatService.removeChatFromProject(chatId)
      await loadChats()
      await loadProjects()
    } catch (error) {
      console.error('Error al quitar chat del proyecto:', error)
    }
  }

  const handleSelectProject = async (projectId) => {
    setShowProjectSelector(false)
    
    if (projectId === null) {
      // Crear nuevo proyecto
      setProjectModalMode('create')
      setEditingProject(null)
      setShowProjectModal(true)
    } else {
      // Agregar a proyecto existente
      try {
        await chatService.addChatToProject(selectedChatForProject, projectId)
        await loadChats()
        await loadProjects()
      } catch (error) {
        console.error('Error al agregar chat al proyecto:', error)
      }
    }
  }

  const handleSaveProject = async (name) => {
    try {
      if (projectModalMode === 'create') {
        const newProject = await chatService.createProject(name)
        // Si hay un chat seleccionado, agregarlo al proyecto recién creado
        if (selectedChatForProject) {
          await chatService.addChatToProject(selectedChatForProject, newProject.id)
        }
      } else if (projectModalMode === 'edit' && editingProject) {
        await chatService.updateProjectName(editingProject.id, name)
      }
      await loadChats()
      await loadProjects()
    } catch (error) {
      console.error('Error al guardar proyecto:', error)
    }
  }

  const handleToggleProjectExpanded = async (projectId, isExpanded) => {
    try {
      await chatService.toggleProjectExpanded(projectId, isExpanded)
      await loadProjects()
    } catch (error) {
      console.error('Error al cambiar estado del proyecto:', error)
    }
  }

  const handleProjectContextMenu = (e, project) => {
    e.preventDefault()
    e.stopPropagation()
    setProjectContextMenu({
      project,
      position: { top: e.clientY, left: e.clientX }
    })
  }

  const handleEditProject = (project) => {
    setProjectModalMode('edit')
    setEditingProject(project)
    setShowProjectModal(true)
    setProjectContextMenu(null)
  }

  const handleDeleteProject = async (projectId) => {
    try {
      await chatService.deleteProject(projectId)
      await loadChats()
      await loadProjects()
      setProjectContextMenu(null)
    } catch (error) {
      console.error('Error al eliminar proyecto:', error)
    }
  }

  // Exponer la función refreshChats al componente padre
  useImperativeHandle(ref, () => ({
    refreshChats: () => {
      loadChats()
      loadProjects()
    }
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
            disabled={!hasMessages || isLoading}
            aria-label="Crear nuevo chat"
          >
            <RiChatNewLine className="new-chat-icon-compact" />
          </button>
        )}

        <div className="left-sidebar-content">
          {/* Lista de chats */}
          {isAuthenticated && isOpen && (
            <div className="chats-list-container">
              {/* Contenedor de botones */}
              <div className="chat-actions-container">
                {/* Botón de nuevo chat */}
                <button 
                  className="new-chat-button"
                  onClick={onNewChat}
                  disabled={!hasMessages || isLoading}
                  aria-label="Crear nuevo chat"
                >
                  <RiChatNewLine className="new-chat-icon" />
                  <span>Nuevo chat</span>
                </button>

                {/* Botón de búsqueda */}
                <button 
                  className="search-button"
                  onClick={handleSearchToggle}
                  aria-label="Buscar chats"
                >
                  <IoSearch className="search-icon" />
                </button>
              </div>

              {/* Barra de búsqueda */}
              {isSearchOpen && (
                <div className="search-bar-container">
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="search-input"
                    placeholder="Buscar por título o fecha"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button 
                    className="search-close-button"
                    onClick={handleSearchToggle}
                    aria-label="Cerrar búsqueda"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="chats-list">
                {isLoadingChats ? (
                  <div className="chats-loading">Cargando chats...</div>
                ) : filteredChats.length === 0 && projects.length === 0 ? (
                  <div className="chats-empty">
                    {searchQuery ? 'No se encontraron chats' : 'No hay chats guardados'}
                  </div>
                ) : (
                  <>
                    {/* Sección de proyectos */}
                    {projects.length > 0 && (
                      <div className="chats-section">
                        <div className="chats-section-header">
                          <div className="chats-section-title">Proyectos</div>
                          {!searchQuery && (
                            <button
                              className="new-project-button"
                              onClick={() => {
                                setProjectModalMode('create')
                                setEditingProject(null)
                                setSelectedChatForProject(null)
                                setShowProjectModal(true)
                              }}
                              title="Nuevo proyecto"
                            >
                              <FaFolderPlus />
                            </button>
                          )}
                        </div>
                        {projects.map((project) => {
                          // Filtrar chats del proyecto por búsqueda
                          const projectFilteredChats = project.chats?.filter(chat =>
                            filteredChats.some(fc => fc.id === chat.id)
                          ) || []
                          
                          // Solo mostrar proyecto si tiene chats que coinciden con la búsqueda
                          if (searchQuery && projectFilteredChats.length === 0) {
                            return null
                          }
                          
                          return (
                            <div key={project.id} className="project-container">
                              <div
                                className="project-header"
                                onClick={() => handleToggleProjectExpanded(project.id, !project.is_expanded)}
                                onContextMenu={(e) => handleProjectContextMenu(e, project)}
                              >
                                <MdKeyboardArrowDown
                                  className={`project-arrow ${(searchQuery || project.is_expanded) ? 'expanded' : ''}`}
                                />
                                <span className="project-name">{project.name}</span>
                                <span className="project-count">
                                  ({searchQuery ? projectFilteredChats.length : project.chats?.length || 0})
                                </span>
                              </div>
                              {(searchQuery || project.is_expanded) && projectFilteredChats.length > 0 && (
                                <div className="project-chats">
                                  {projectFilteredChats.map((chat) => (
                                    <div
                                      key={chat.id}
                                      className={`chat-item project-chat ${currentChatId === chat.id ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}
                                      onClick={() => handleChatClick(chat.id)}
                                      style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
                                    >
                                      <div className="chat-item-title">{chat.title}</div>
                                      <ChatOptionsMenu
                                        chat={chat}
                                        onEdit={handleEditChat}
                                        onTogglePin={handleTogglePin}
                                        onDelete={handleDeleteChat}
                                        onAddToProject={handleAddToProject}
                                        onRemoveFromProject={handleRemoveFromProject}
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Sección de chats fijados */}
                    {filteredChats.some(chat => chat.pinned && !chat.project_id) && (
                      <div className="chats-section">
                        <div className="chats-section-title">Fijados</div>
                        {filteredChats
                          .filter(chat => chat.pinned && !chat.project_id)
                          .map((chat) => (
                            <div
                              key={chat.id}
                              className={`chat-item ${currentChatId === chat.id ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}
                              onClick={() => handleChatClick(chat.id)}
                              style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
                            >
                              <div className="chat-item-title">{chat.title}</div>
                              <ChatOptionsMenu
                                chat={chat}
                                onEdit={handleEditChat}
                                onTogglePin={handleTogglePin}
                                onDelete={handleDeleteChat}
                                onAddToProject={handleAddToProject}
                                onRemoveFromProject={handleRemoveFromProject}
                              />
                            </div>
                          ))}
                      </div>
                    )}
                    
                    {/* Sección de chats recientes */}
                    {filteredChats.some(chat => !chat.pinned && !chat.project_id) && (
                      <div className="chats-section">
                        {(filteredChats.some(chat => chat.pinned && !chat.project_id) || projects.length > 0) && (
                          <div className="chats-section-title">Recientes</div>
                        )}
                        {filteredChats
                          .filter(chat => !chat.pinned && !chat.project_id)
                          .map((chat) => (
                            <div
                              key={chat.id}
                              className={`chat-item ${currentChatId === chat.id ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}
                              onClick={() => handleChatClick(chat.id)}
                              style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
                            >
                              <div className="chat-item-title">{chat.title}</div>
                              <ChatOptionsMenu
                                chat={chat}
                                onEdit={handleEditChat}
                                onTogglePin={handleTogglePin}
                                onDelete={handleDeleteChat}
                                onAddToProject={handleAddToProject}
                                onRemoveFromProject={handleRemoveFromProject}
                              />
                            </div>
                          ))}
                      </div>
                    )}
                  </>
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

      {/* Modal de selector de proyecto */}
      <ProjectSelector
        isOpen={showProjectSelector}
        onClose={() => setShowProjectSelector(false)}
        onSelectProject={handleSelectProject}
        projects={projects}
        position={selectorPosition}
      />

      {/* Modal para crear/editar proyecto */}
      <ProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onSave={handleSaveProject}
        initialName={editingProject?.name || ''}
        title={projectModalMode === 'create' ? 'Nuevo proyecto' : 'Editar proyecto'}
      />

      {/* Menú contextual de proyecto */}
      {projectContextMenu && (
        <div
          ref={projectContextMenuRef}
          className="project-context-menu"
          style={{
            position: 'fixed',
            top: `${projectContextMenu.position.top}px`,
            left: `${projectContextMenu.position.left}px`,
            zIndex: 1200
          }}
        >
          <button
            className="project-context-item"
            onClick={() => handleEditProject(projectContextMenu.project)}
          >
            <MdEdit className="context-icon" />
            <span>Editar título</span>
          </button>
          <button
            className="project-context-item delete"
            onClick={() => handleDeleteProject(projectContextMenu.project.id)}
          >
            <FaTrash className="context-icon" />
            <span>Eliminar</span>
          </button>
        </div>
      )}
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
  isLoading: PropTypes.bool,
}

export default LeftSidebar
