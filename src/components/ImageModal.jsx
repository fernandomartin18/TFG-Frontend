import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { MdClose, MdDelete } from 'react-icons/md'
import '../css/ImageModal.css'

function ImageModal({ image, onClose, onDelete, showDeleteButton = true }) {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const modalContent = (
    <div className="image-modal-backdrop" onClick={handleBackdropClick}>
      <div className="image-modal">
        <div className="image-modal-header">
          <h3 className="image-modal-title">{image.name}</h3>
          <button
            type="button"
            className="image-modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <MdClose size={24} />
          </button>
        </div>
        
        <div className="image-modal-content">
          <img src={image.url} alt={image.name} className="image-modal-img" />
        </div>

        {showDeleteButton && (
          <div className="image-modal-footer">
            <button
              type="button"
              className="image-modal-delete"
              onClick={onDelete}
            >
              <MdDelete size={20} />
              Eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

ImageModal.propTypes = {
  image: PropTypes.shape({
    url: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  showDeleteButton: PropTypes.bool
}

export default ImageModal
