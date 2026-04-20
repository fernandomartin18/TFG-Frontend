import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { BsInfoCircle, BsGear } from 'react-icons/bs'
import { MdClose } from 'react-icons/md'
import { fetchWithAuth } from '../services/api.service'
import '../css/ModelSelector.css'

function ModelSelector({ selectedModel, onModelChange, autoModeConfig, onAutoModeConfigChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showAutoConfigModal, setShowAutoConfigModal] = useState(false)
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(false)
  const [autoAvailable, setAutoAvailable] = useState(false)
  const [defaultAutoModels, setDefaultAutoModels] = useState({ vision: '', coding: '' })
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
      const response = await fetchWithAuth('http://localhost:3000/api/models')
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

  const setInitialModel = async (isAutoAvailable) => {
    if (selectedModel) return

    try {
      const modelsResponse = await fetchWithAuth('http://localhost:3000/api/models')
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
    } catch {
      onModelChange('No hay LLMs')
    }
  }

  const checkAutoMode = async () => {
    try {
      const response = await fetchWithAuth('http://localhost:3000/api/models/auto-select')
      if (response.ok) {
        const data = await response.json()
        const isAutoAvailable = data.auto_available || false
        setAutoAvailable(isAutoAvailable)
        if (isAutoAvailable) {
          setDefaultAutoModels({
            vision: data.vision_model || '',
            coding: data.coding_model || ''
          })
        }
        await setInitialModel(isAutoAvailable)
      }
    } catch (error) {
      console.error('Error checking auto mode:', error)
      setAutoAvailable(false)
      await setInitialModel(false)
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

  const handleAutoConfigClick = (e) => {
    e.stopPropagation()
    setShowAutoConfigModal(true)
  }

  const handleCloseModal = () => {
    setShowInfoModal(false)
    setShowAutoConfigModal(false)
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseModal()
    }
  }

  const renderModelOptions = () => {
    if (loading) return <div className="model-option loading">Cargando...</div>
    if (models.length === 0) return <div className="model-option disabled">No hay LLMs</div>

    return (
      <>
        <button 
          className={`model-option ${selectedModel === 'Auto' ? 'selected' : ''} ${autoAvailable ? '' : 'disabled'}`}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          onClick={autoAvailable ? () => handleSelectModel('Auto') : undefined}
          disabled={!autoAvailable}
        >
          <span>Auto</span>
          {autoAvailable && (
            <button 
              type="button"
              className="auto-config-btn"
              onClick={handleAutoConfigClick}
              title="Configurar modo Auto"
            >
              <BsGear size={16} />
            </button>
          )}
        </button>
        {models.map((model) => (
          <button 
            key={model.name}
            className={`model-option ${selectedModel === model.name ? 'selected' : ''}`}
            onClick={() => handleSelectModel(model.name)}
          >
            {model.name}
          </button>
        ))}
      </>
    )
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
          
          {renderModelOptions()}
        </div>
      )}

      {showInfoModal && (
        <div 
          role="presentation"
          className="info-modal-backdrop" 
          onClick={handleBackdropClick}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleCloseModal()
            }
          }}
        >
          <div className="info-modal" role="dialog" aria-modal="true">
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
                {'.'}
              </p>
              <p>Instala el que desees vía terminal usando el comando:</p>
              <code className="info-code">ollama pull &lt;nombre_del_modelo[:parámetros]&gt;</code>
              <p><br></br>Para que funcione el módo automático, es necesario tener un modelo con reconocimiento de imágenes y otro con capacidades de lenguaje instalados.</p>
            </div>
          </div>
        </div>
      )}
      {showAutoConfigModal && (
        <div 
          role="presentation"
          className="info-modal-backdrop" 
          onClick={handleBackdropClick}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleCloseModal()
            }
          }}
        >
          <div className="info-modal" role="dialog" aria-modal="true">
            <button 
              className="info-modal-close"
              onClick={handleCloseModal}
              title="Cerrar"
            >
              <MdClose size={24} />
            </button>
            <div className="info-modal-content">
              <h3>Configuración Modo Auto</h3>
              
              <div className="auto-config-option" style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                  <input 
                    type="radio" 
                    name="autoConfigType" 
                    checked={autoModeConfig?.type === 'default'}
                    onChange={() => onAutoModeConfigChange({ ...autoModeConfig, type: 'default' })}
                  />
                  <span>Por defecto</span>
                </label>
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', opacity: 0.8, paddingLeft: '24px' }}>
                  Selecciona automáticamente el mejor modelo disponible equipado con visión (para leer imágenes y PlantUML) y luego el modelo de lenguaje más potente para generar el código.
                </p>
              </div>

              <div className="auto-config-option" style={{ marginTop: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                  <input 
                    type="radio" 
                    name="autoConfigType" 
                    checked={autoModeConfig?.type === 'custom'}
                    onChange={() => onAutoModeConfigChange({ 
                      type: 'custom', 
                      visionModel: autoModeConfig?.visionModel || defaultAutoModels.vision || models[0]?.name || '', 
                      codingModel: autoModeConfig?.codingModel || defaultAutoModels.coding || (models.length > 1 ? models[1]?.name : models[0]?.name) || '' 
                    })}
                  />
                  <span>Personalizado</span>
                </label>
                
                {autoModeConfig?.type === 'custom' && (
                  <div style={{ marginTop: '1rem', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label htmlFor="vision-model-select" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Modelo Multimodal (Visión)</label>
                      <select 
                        id="vision-model-select"
                        value={autoModeConfig.visionModel} 
                        onChange={(e) => {
                          const newVisionModel = e.target.value;
                          const newConfig = { ...autoModeConfig, visionModel: newVisionModel };
                          if (models.length === 2 && newVisionModel === autoModeConfig.codingModel) {
                             newConfig.codingModel = models.find(m => m.name !== newVisionModel)?.name || newVisionModel;
                          }
                          onAutoModeConfigChange(newConfig);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-color)' }}
                      >
                        {models.map(m => (
                          <option key={m.name} value={m.name} disabled={models.length > 2 && m.name === autoModeConfig.codingModel}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label htmlFor="coding-model-select" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Modelo Generador de Código</label>
                      <select 
                        id="coding-model-select"
                        value={autoModeConfig.codingModel} 
                        onChange={(e) => {
                          const newCodingModel = e.target.value;
                          const newConfig = { ...autoModeConfig, codingModel: newCodingModel };
                          if (models.length === 2 && newCodingModel === autoModeConfig.visionModel) {
                             newConfig.visionModel = models.find(m => m.name !== newCodingModel)?.name || newCodingModel;
                          }
                          onAutoModeConfigChange(newConfig);
                        }}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-color)' }}
                      >
                        {models.map(m => (
                          <option key={m.name} value={m.name} disabled={models.length > 2 && m.name === autoModeConfig.visionModel}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}

ModelSelector.propTypes = {
  selectedModel: PropTypes.string.isRequired,
  onModelChange: PropTypes.func.isRequired,
  autoModeConfig: PropTypes.object,
  onAutoModeConfigChange: PropTypes.func
}

export default ModelSelector
