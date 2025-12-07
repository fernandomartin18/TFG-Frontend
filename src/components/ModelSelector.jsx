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
  const [autoAvailable, setAutoAvailable] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    fetchModels()
    checkAutoMode()
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
        const modelList = data.models || []
        setModels(modelList)
        
        // Solo actualizar si selectedModel está vacío (carga inicial)
        if (!selectedModel) {
          if (modelList.length === 0) {
            onModelChange('No hay LLMs')
          }
          // Si hay modelos, esperar a checkAutoMode para decidir
        }
      }
    } catch (error) {
      console.error('Error fetching models:', error)
      if (!selectedModel) {
        onModelChange('No hay LLMs')
      }
    } finally {
      setLoading(false)
    }
  }

  const checkAutoMode = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/models/auto-select')
      if (response.ok) {
        const data = await response.json()
        const isAutoAvailable = data.auto_available || false
        setAutoAvailable(isAutoAvailable)
        
        // Solo configurar modelo inicial si selectedModel está vacío
        if (!selectedModel) {
          const modelsResponse = await fetch('http://localhost:3000/api/models')
          if (modelsResponse.ok) {
            const modelsData = await modelsResponse.json()
            const modelList = modelsData.models || []
            
            if (modelList.length === 0) {
              onModelChange('No hay LLMs')
            } else if (isAutoAvailable) {
              onModelChange('Auto')
            } else {
              onModelChange(modelList[0].name)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking auto mode:', error)
      setAutoAvailable(false)
      
      // Si hay error y no hay modelo seleccionado, intentar seleccionar el primero
      if (!selectedModel) {
        const modelsResponse = await fetch('http://localhost:3000/api/models')
        if (modelsResponse.ok) {
          const modelsData = await modelsResponse.json()
          const modelList = modelsData.models || []
          if (modelList.length > 0) {
            onModelChange(modelList[0].name)
          } else {
            onModelChange('No hay LLMs')
          }
        }
      }
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
        <div className="model-selector-value">
          {selectedModel || 'No hay LLMs'}
        </div>
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
          ) : models.length === 0 ? (
            <div className="model-option disabled">No hay LLMs</div>
          ) : (
            <>
              <div 
                className={`model-option ${selectedModel === 'Auto' ? 'selected' : ''} ${!autoAvailable ? 'disabled' : ''}`}
                onClick={autoAvailable ? () => handleSelectModel('Auto') : undefined}
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
