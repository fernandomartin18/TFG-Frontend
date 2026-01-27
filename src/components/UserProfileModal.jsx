import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { IoLogOutOutline, IoClose } from 'react-icons/io5'
import { MdEdit } from 'react-icons/md'
import { CgDarkMode } from 'react-icons/cg'
import { RiEye2Line, RiEyeCloseLine } from 'react-icons/ri'
import authService from '../services/auth.service'
import '../css/UserProfileModal.css'

function UserProfileModal({ onClose, isDarkTheme, onToggleTheme }) {
  const [user, setUser] = useState(null)
  const [editedUsername, setEditedUsername] = useState('')
  const [newAvatar, setNewAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [isEditingAvatar, setIsEditingAvatar] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const fileInputRef = useRef(null)
  
  // Estados para cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  
  // Estados para mostrar/ocultar contraseñas
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    const userData = authService.getUser()
    setUser(userData)
    setEditedUsername(userData?.username || '')
    setAvatarPreview(userData?.avatarUrl || null)
  }, [])

  useEffect(() => {
    // Cerrar bocadillo al hacer clic fuera
    const handleClickOutside = (e) => {
      if (isEditingAvatar && !e.target.closest('.modal-avatar-container')) {
        setIsEditingAvatar(false)
      }
    }

    if (isEditingAvatar) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEditingAvatar])

  useEffect(() => {
    if (!user) return
    
    const usernameChanged = editedUsername !== user.username
    const originalAvatar = user.avatarUrl || ''
    const currentAvatar = avatarPreview || ''
    const avatarChanged = newAvatar !== null || (originalAvatar !== currentAvatar)
    const passwordFieldsFilled = currentPassword || newPassword || confirmPassword
    
    setHasChanges(usernameChanged || avatarChanged || passwordFieldsFilled)
  }, [editedUsername, newAvatar, avatarPreview, user, currentPassword, newPassword, confirmPassword])

  const handleUsernameChange = (e) => {
    const value = e.target.value
    setEditedUsername(value)
    
    if (value.length < 3 && value.length > 0) {
      setUsernameError('Mínimo 3 caracteres')
    } else {
      setUsernameError('')
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setNewAvatar(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const maxWidth = 400
          const maxHeight = 400
          let width = img.width
          let height = img.height

          // Redimensionar manteniendo aspecto
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          // Convertir a base64 con calidad reducida (70%)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7)
          setAvatarPreview(compressedBase64)
          
          // Limpiar el input para permitir seleccionar la misma foto de nuevo
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }
        img.src = reader.result
      }
      reader.readAsDataURL(file)
      setIsEditingAvatar(false)
    }
  }

  const handleRemoveAvatar = () => {
    setNewAvatar(null)
    setAvatarPreview('') // Cadena vacía
    setHasChanges(true) // Marcar que hay cambios
    setIsEditingAvatar(false)
    // Limpiar el input para permitir seleccionar archivos de nuevo
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleEditAvatarClick = () => {
    // Si no hay avatar, abrir selector directamente
    if (!avatarPreview) {
      fileInputRef.current?.click()
    } else {
      // Si hay avatar, mostrar/ocultar opciones
      setIsEditingAvatar(!isEditingAvatar)
    }
  }

  const handleSaveChanges = async () => {
    // Limpiar errores previos
    setUsernameError('')
    setPasswordError('')

    if (editedUsername.length < 3) {
      setUsernameError('Mínimo 3 caracteres')
      return
    }

    // Validar contraseñas si se están cambiando
    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setPasswordError('Debes completar todos los campos de contraseña')
        return
      }
      if (newPassword.length < 6) {
        setPasswordError('La nueva contraseña debe tener al menos 6 caracteres')
        return
      }
      // Validar que tenga mayúscula, minúscula y número
      const hasUpperCase = /[A-Z]/.test(newPassword)
      const hasLowerCase = /[a-z]/.test(newPassword)
      const hasNumber = /\d/.test(newPassword)
      
      if (!hasUpperCase || !hasLowerCase || !hasNumber) {
        setPasswordError('La contraseña debe contener al menos una mayúscula, una minúscula y un número')
        return
      }
      if (newPassword !== confirmPassword) {
        setPasswordError('Las contraseñas no coinciden')
        return
      }
    }

    try {
      // Guardar perfil
      await authService.updateUserProfile(editedUsername, avatarPreview)

      // Cambiar contraseña
      if (currentPassword && newPassword) {
        const response = await fetch('http://localhost:3000/api/users/me/password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authService.getAccessToken()}`
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword
          })
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Error al cambiar contraseña')
        }
      }

      // Actualizar estado local
      const updatedUser = {
        ...user,
        username: editedUsername,
        avatarUrl: avatarPreview
      }
      setUser(updatedUser)
      setHasChanges(false)
      setNewAvatar(null)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordError('')
      
      // Notificar a otros componentes
      window.dispatchEvent(new Event('userProfileUpdated'))
      
      // Cerrar el modal
      onClose()
    } catch (error) {
      console.error('Error al guardar cambios:', error)
      alert(error.message || 'Error al guardar los cambios')
    }
  }

  const handleLogout = async () => {
    await authService.logout()
    window.dispatchEvent(new Event('authChange'))
    onClose()
  }

  const handleClose = () => {
    if (hasChanges) {
      const confirmClose = window.confirm('¿Quieres guardar los cambios antes de cerrar?')
      if (confirmClose) {
        handleSaveChanges()
        return
      }
    }
    onClose()
  }

  const getInitial = (username) => {
    if (!username) return '?'
    return username.charAt(0).toUpperCase()
  }

  if (!user) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        {/* Botón cerrar */}
        <button className="modal-close-btn" onClick={handleClose}>
          <IoClose />
        </button>

        <div className="modal-content-scroll">
          {/* Avatar y botón editar */}
          <div className="modal-avatar-section">
            <div className="modal-avatar-container">
              <div className="modal-avatar">
                {avatarPreview ? (
                  <img src={avatarPreview} alt={user.username} />
                ) : (
                  <span className="modal-avatar-initial">{getInitial(user.username)}</span>
                )}
              </div>
              <button 
                className="avatar-edit-btn"
                onClick={handleEditAvatarClick}
              >
                <MdEdit />
              </button>
              
              {/* Input de archivo oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
              
              {/* Bocadillo flotante con opciones */}
              {isEditingAvatar && avatarPreview && (
                <div className="avatar-options-popup">
                  <button 
                    className="popup-option"
                    onClick={() => {
                      fileInputRef.current?.click()
                      setIsEditingAvatar(false)
                    }}
                  >
                    Cambiar foto
                  </button>
                  <button 
                    className="popup-option delete"
                    onClick={handleRemoveAvatar}
                  >
                    Eliminar foto
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sección Nombre */}
          <div className="modal-section">
            <h3 className="section-title">NOMBRE</h3>
            <div className="modal-username-section">
              <input
                type="text"
                className={`username-input ${usernameError ? 'error' : ''}`}
                value={editedUsername}
                onChange={handleUsernameChange}
                placeholder="Nombre de usuario"
              />
              {usernameError && <span className="username-error">{usernameError}</span>}
            </div>
          </div>

          {/* Sección Cambiar Contraseña */}
          <div className="modal-section">
            <h3 className="section-title">CAMBIAR CONTRASEÑA</h3>
            <div className="password-fields">
              <div className="password-input-wrapper">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  className="password-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Contraseña actual"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <RiEyeCloseLine /> : <RiEye2Line />}
                </button>
              </div>
              <div className="password-input-wrapper">
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="password-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nueva contraseña"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <RiEyeCloseLine /> : <RiEye2Line />}
                </button>
              </div>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="password-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar nueva contraseña"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <RiEyeCloseLine /> : <RiEye2Line />}
                </button>
              </div>
              {passwordError && <span className="password-error">{passwordError}</span>}
            </div>
          </div>

          {/* Sección Otros */}
          <div className="modal-section">
            <h3 className="section-title">OTROS</h3>
            
            {/* Switch tema */}
            <div className="modal-option theme-option">
              <CgDarkMode className="option-icon" />
              <span className="option-label">Modo oscuro</span>
              <label className="theme-switch">
                <input
                  type="checkbox"
                  checked={isDarkTheme}
                  onChange={onToggleTheme}
                />
                <span className="switch-slider"></span>
              </label>
            </div>

            {/* Cerrar sesión */}
            <button className="modal-option logout-option" onClick={handleLogout}>
              <IoLogOutOutline className="option-icon" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>

        {/* Botón guardar cambios - fijo al final */}
        {hasChanges && (
          <button className="save-changes-btn-fixed" onClick={handleSaveChanges}>
            Guardar cambios
          </button>
        )}
      </div>
    </div>
  )
}

UserProfileModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  isDarkTheme: PropTypes.bool.isRequired,
  onToggleTheme: PropTypes.func.isRequired
}

export default UserProfileModal
