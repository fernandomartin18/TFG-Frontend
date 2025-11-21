import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import '../css/ModelSelector.css'

function ModelSelector({ selectedModel, onModelChange }) {
  const [isOpen, setIsOpen] = useState(false)
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
    </div>
  )
}

ModelSelector.propTypes = {
  selectedModel: PropTypes.string.isRequired,
  onModelChange: PropTypes.func.isRequired
}

export default ModelSelector
