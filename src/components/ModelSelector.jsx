import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { BsInfoCircle } from 'react-icons/bs'
import { MdClose } from 'react-icons/md'
import '../css/ModelSelector.css'

function ModelSelector({ selectedModel, onModelChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    fetchModels()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const fetchModels = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:3000/api/models')
      if (response.ok) {
        const data = await response.json()
        setModels(data.models || [])
      }
    } catch (error) {
      console.error('Error fetching models:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleSelectModel = (model) => {
    onModelChange(model)
    setIsOpen(false)
  }

  const handleInfoClick = (e) => {
    e.stopPropagation()
    setShowInfoModal(true)
  }

  const handleCloseModal = () => {
    setShowInfoModal(false)
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseModal()
    }
  }

  return (
    <div className="model-selector" ref={dropdownRef}>
      <button 
        type="button"
        className="model-selector-button"
        onClick={handleToggle}
      >
        <div className="model-selector-label">Modelo</div>
        <div className="model-selector-value">{selectedModel}</div>
      </button>

      {isOpen && (
        <div className="model-dropdown">
          <button
            type="button"
            className="model-info-button"
            onClick={handleInfoClick}
            title="Información sobre modelos"
          >
            <BsInfoCircle size={18} />
          </button>
          
          {loading ? (
            <div className="model-option loading">Cargando...</div>
          ) : (
            <>
              <div 
                className={`model-option ${selectedModel === 'Auto' ? 'selected' : ''}`}
                onClick={() => handleSelectModel('Auto')}
              >
                Auto
              </div>
              {models.map((model) => (
                <div 
                  key={model.name}
                  className={`model-option ${selectedModel === model.name ? 'selected' : ''}`}
                  onClick={() => handleSelectModel(model.name)}
                >
                  {model.name}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {showInfoModal && (
        <div className="info-modal-backdrop" onClick={handleBackdropClick}>
          <div className="info-modal">
            <button 
              className="info-modal-close"
              onClick={handleCloseModal}
              title="Cerrar"
            >
              <MdClose size={24} />
            </button>
            <div className="info-modal-content">
              <p>Aquí se mostrarán los modelos que tengas instalados en Ollama.</p>
              <p>
                Para buscar modelos disponibles,{' '}
                <a 
                  href="https://ollama.com/library" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="info-link"
                >
                  pulsa aquí
                </a>
                .
              </p>
              <p>Instala el que desees vía terminal usando el comando:</p>
              <code className="info-code">ollama pull &lt;nombre_del_modelo[:parámetros]&gt;</code>
              <p><br></br>Para que funcione el módo automático, es necesario tener un modelo con reconocimiento de imágenes y otro con capacidades de lenguaje instalados.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

ModelSelector.propTypes = {
  selectedModel: PropTypes.string.isRequired,
  onModelChange: PropTypes.func.isRequired
}

export default ModelSelector
