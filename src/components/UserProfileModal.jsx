import PropTypes from 'prop-types'
import { IoLogOutOutline } from 'react-icons/io5'
import authService from '../services/auth.service'
import '../css/UserProfileModal.css'

function UserProfileModal({ onClose }) {
  const handleLogout = async () => {
    await authService.logout()
    window.dispatchEvent(new Event('authChange'))
    onClose()
  }

  return (
    <div className="user-profile-modal">
      <button className="modal-option logout-option" onClick={handleLogout}>
        <IoLogOutOutline className="option-icon" />
        <span>Cerrar sesión</span>
      </button>
    </div>
  )
}

UserProfileModal.propTypes = {
  onClose: PropTypes.func.isRequired
}

export default UserProfileModal
