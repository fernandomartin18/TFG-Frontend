import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { RiImageAddFill } from 'react-icons/ri'
import ImageModal from './ImageModal'
import ImageDropdown from './ImageDropdown'
import { fetchWithAuth } from '../services/api.service'
import '../css/ImageUploader.css'

function ImageUploader({ images, onImagesChange, selectedModel }) {
  const [showModal, setShowModal] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  
  // Establecer estado inicial usando heurística de nombres para evitar latencia/parpadeos
  const [canAddImages, setCanAddImages] = useState(() => {
    if (!selectedModel || selectedModel === 'No hay LLMs') return false
    if (selectedModel === 'Auto') return true
    const modelLower = selectedModel.toLowerCase()
    const visionKeywords = ['vl', 'vision', 'llava', 'bakllava', 'moondream', 'e2b', 'minicpm', 'pixtral', 'paligemma']
    return visionKeywords.some(keyword => modelLower.includes(keyword))
  })
  
  const fileInputRef = useRef(null)

  // Determinar si el modelo seleccionado tiene capacidades de visión consultando al backend
  useEffect(() => {
    let isMounted = true;

    if (selectedModel && selectedModel !== 'No hay LLMs') {
      const modelLower = selectedModel.toLowerCase();
      const visionKeywords = ['vl', 'vision', 'llava', 'bakllava', 'moondream', 'e2b', 'minicpm', 'pixtral', 'paligemma'];
      setCanAddImages(selectedModel === 'Auto' || visionKeywords.some(keyword => modelLower.includes(keyword)));
    } else {
      setCanAddImages(false);
    }

    const checkVisionCapabilities = async () => {
      if (!selectedModel || selectedModel === 'No hay LLMs') {
        if (isMounted) setCanAddImages(false)
        return
      }
      if (selectedModel === 'Auto') {
        if (isMounted) setCanAddImages(true)
        return
      }
      
      try {
        const response = await fetchWithAuth('http://localhost:3000/api/models')
        if (response.ok) {
          const data = await response.json()
          const modelInfo = data.models?.find(m => m.name === selectedModel)
          
          if (isMounted) {
            if (modelInfo && typeof modelInfo.has_vision !== 'undefined') {
              setCanAddImages(modelInfo.has_vision)
            } else {
              // Fallback
              const modelLower = selectedModel.toLowerCase()
              const visionKeywords = ['vl', 'vision', 'llava', 'bakllava', 'moondream', 'e2b', 'minicpm', 'pixtral', 'paligemma']
              setCanAddImages(visionKeywords.some(keyword => modelLower.includes(keyword)))
            }
          }
        }
      } catch (err) {
        console.error('Error fetching model capabilities:', err)
      }
    }

    checkVisionCapabilities()
    
    return () => {
      isMounted = false
    }
  }, [selectedModel])

  const handleAddClick = () => {
    if (images.length < 5 && canAddImages) {
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
        className={`add-image-button ${(images.length >= 5 || !canAddImages) ? 'disabled' : ''}`}
        onClick={handleAddClick}
        disabled={images.length >= 5 || !canAddImages}
        title={
          !canAddImages 
            ? 'Selecciona un modelo con visión o Auto para añadir imágenes'
            : images.length >= 5 
              ? 'Máximo 5 imágenes' 
              : 'Añadir imagen'
        }
      >
        <RiImageAddFill size={24} />
      </button>

      {images.length > 0 && (
        <div className="image-preview-container">
          <button
            type="button"
            className={`image-preview-button ${!canAddImages ? 'disabled' : ''}`}
            onClick={handlePreviewClick}
            title={!canAddImages ? 'El modelo seleccionado no puede leer imágenes' : 'Ver imágenes'}
          >
            <img 
              src={images[0].url} 
              alt="Preview" 
              className={`image-preview ${!canAddImages ? 'disabled' : ''}`}
            />
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
  onImagesChange: PropTypes.func.isRequired,
  selectedModel: PropTypes.string.isRequired
}

export default ImageUploader
