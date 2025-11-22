import { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import { RiImageAddFill } from 'react-icons/ri'
import ImageModal from './ImageModal'
import ImageDropdown from './ImageDropdown'
import '../css/ImageUploader.css'

function ImageUploader({ images, onImagesChange }) {
  const [showModal, setShowModal] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const fileInputRef = useRef(null)

  const handleAddClick = () => {
    if (images.length < 5) {
      fileInputRef.current?.click()
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    const remainingSlots = 5 - images.length
    const filesToAdd = files.slice(0, remainingSlots)

    const newImages = filesToAdd.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }))

    onImagesChange([...images, ...newImages])
    e.target.value = '' // Reset input
  }

  const handlePreviewClick = () => {
    if (images.length === 1) {
      setSelectedImageIndex(0)
      setShowModal(true)
    } else if (images.length > 1) {
      setShowDropdown(!showDropdown)
    }
  }

  const handleImageClick = (index) => {
    setSelectedImageIndex(index)
    setShowModal(true)
    setShowDropdown(false)
  }

  const handleDeleteImage = (index) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
    
    if (showModal && selectedImageIndex === index) {
      setShowModal(false)
      setSelectedImageIndex(null)
    } else if (showModal && selectedImageIndex > index) {
      setSelectedImageIndex(selectedImageIndex - 1)
    }
  }

  const handleDeleteFromModal = () => {
    if (selectedImageIndex !== null) {
      handleDeleteImage(selectedImageIndex)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedImageIndex(null)
  }

  return (
    <div className="image-uploader">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <button
        type="button"
        className={`add-image-button ${images.length >= 5 ? 'disabled' : ''}`}
        onClick={handleAddClick}
        disabled={images.length >= 5}
        title={images.length >= 5 ? 'Máximo 5 imágenes' : 'Añadir imagen'}
      >
        <RiImageAddFill size={24} />
      </button>

      {images.length > 0 && (
        <div className="image-preview-container">
          <button
            type="button"
            className="image-preview-button"
            onClick={handlePreviewClick}
          >
            <img src={images[0].url} alt="Preview" className="image-preview" />
            {images.length > 1 && (
              <div className="image-count-badge">+{images.length - 1}</div>
            )}
          </button>

          {showDropdown && images.length > 1 && (
            <ImageDropdown
              images={images}
              onImageClick={handleImageClick}
              onDeleteImage={handleDeleteImage}
              onClose={() => setShowDropdown(false)}
            />
          )}
        </div>
      )}

      {showModal && selectedImageIndex !== null && (
        <ImageModal
          image={images[selectedImageIndex]}
          onClose={handleCloseModal}
          onDelete={handleDeleteFromModal}
        />
      )}
    </div>
  )
}

ImageUploader.propTypes = {
  images: PropTypes.array.isRequired,
  onImagesChange: PropTypes.func.isRequired
}

export default ImageUploader
