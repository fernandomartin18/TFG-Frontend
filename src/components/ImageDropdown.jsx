import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { MdDelete } from 'react-icons/md'
import '../css/ImageDropdown.css'

function ImageDropdown({ images, onImageClick, onDeleteImage, onClose }) {
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  const handleDelete = (e, index) => {
    e.stopPropagation()
    onDeleteImage(index)
  }

  return (
    <div className="image-dropdown" ref={dropdownRef}>
      {images.map((image, index) => (
        <div key={index} className="image-dropdown-item">
          <button
            type="button"
            className="image-dropdown-preview-btn"
            onClick={() => onImageClick(index)}
          >
            <img 
              src={image.url} 
              alt={image.name} 
              className="image-dropdown-thumbnail"
            />
          </button>
          
          <div className="image-dropdown-name">
            {image.name.length > 20 
              ? `${image.name.substring(0, 20)}...` 
              : image.name}
          </div>
          
          <button
            type="button"
            className="image-dropdown-delete"
            onClick={(e) => handleDelete(e, index)}
            aria-label="Eliminar"
          >
            <MdDelete size={18} />
          </button>
        </div>
      ))}
    </div>
  )
}

ImageDropdown.propTypes = {
  images: PropTypes.array.isRequired,
  onImageClick: PropTypes.func.isRequired,
  onDeleteImage: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
}

export default ImageDropdown
