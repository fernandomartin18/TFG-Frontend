import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { IoSettingsSharp } from 'react-icons/io5'
import authService from '../services/auth.service'
import UserProfileModal from './UserProfileModal'
import '../css/UserProfile.css'

function UserProfile({ isDarkTheme, onToggleTheme, compact = false }) {
  const [user, setUser] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Obtener datos del usuario
    const userData = authService.getUser()
    setUser(userData)

    // Escuchar actualizaciones del perfil
    const handleProfileUpdate = () => {
      const updatedUser = authService.getUser()
      setUser(updatedUser)
    }

    window.addEventListener('userProfileUpdated', handleProfileUpdate)

    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate)
    }
  }, [])

  const handleToggleModal = () => {
    setShowModal(!showModal)
  }

  const getFirstName = (username) => {
    if (!username) return ''
    return username.split(' ')[0]
  }

  const getInitial = (username) => {
    if (!username) return '?'
    return username.charAt(0).toUpperCase()
  }

  if (!user) return null

  return (
    <>
      <div className={`user-profile ${compact ? 'compact' : ''}`} onClick={handleToggleModal}>
        {/* Avatar o inicial */}
        <div className="user-avatar">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username} />
          ) : (
            <span className="user-initial">{getInitial(user.username)}</span>
          )}
        </div>

        {/* Nombre e icono solo en modo expandido */}
        {!compact && (
          <>
            <span className="user-name">{getFirstName(user.username)}</span>
            <IoSettingsSharp className="settings-icon" />
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <UserProfileModal 
          onClose={() => setShowModal(false)}
          isDarkTheme={isDarkTheme}
          onToggleTheme={onToggleTheme}
        />
      )}
    </>
  )
}

UserProfile.propTypes = {
  isDarkTheme: PropTypes.bool.isRequired,
  onToggleTheme: PropTypes.func.isRequired,
  compact: PropTypes.bool
}

export default UserProfile
