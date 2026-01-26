import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { IoSettingsSharp } from 'react-icons/io5'
import authService from '../services/auth.service'
import UserProfileModal from './UserProfileModal'
import '../css/UserProfile.css'

function UserProfile() {
  const [user, setUser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    // Obtener datos del usuario
    const userData = authService.getUser()
    setUser(userData)
  }, [])

  useEffect(() => {
    // Cerrar modal al hacer clic fuera
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowModal(false)
      }
    }

    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showModal])

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
    <div className="user-profile-container" ref={profileRef}>
      <div className="user-profile" onClick={handleToggleModal}>
        {/* Avatar o inicial */}
        <div className="user-avatar">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username} />
          ) : (
            <span className="user-initial">{getInitial(user.username)}</span>
          )}
        </div>

        {/* Nombre */}
        <span className="user-name">{getFirstName(user.username)}</span>

        {/* Icono de ajustes */}
        <IoSettingsSharp className="settings-icon" />
      </div>

      {/* Modal */}
      {showModal && <UserProfileModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

UserProfile.propTypes = {}

export default UserProfile
