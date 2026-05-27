import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

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
        
        // Solo configurar modelo inicial si selectedModel está vacío
        if (!selectedModel) {
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
        }
      }
    } catch (error) {
      console.error('Error checking auto mode:', error)
      setAutoAvailable(false)
      
      // Si hay error y no hay modelo seleccionado, intentar seleccionar el primero
      if (!selectedModel) {
        const modelsResponse = await fetchWithAuth('http://localhost:3000/api/models')
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

  const handleSaveAutoConfig = () => {
    // If it's custom but missing a model, maybe fallback or show error. For now we just close.
    setShowAutoConfigModal(false)
  }

  return (
    <div className="model-selector" ref={dropdownRef}>
      <button 
        type="button"
        className="model-selector-button"
        onClick={handleToggle}
      >
        <div className="model-selector-label">{t('models.selector.model')}</div>
        <div className="model-selector-value">
          {!selectedModel || selectedModel === 'No hay LLMs' ? t('models.selector.noLLMs') : (selectedModel === 'Auto' ? t('models.selector.auto') : selectedModel)}
        </div>
      </button>

      {isOpen && (
        <div className="model-dropdown">
          <button
            type="button"
            className="model-info-button"
            onClick={handleInfoClick}
            title={t('models.info.title')}
          >
            <BsInfoCircle size={18} />
          </button>
          
          {loading ? (
            <div className="model-option loading">{t('models.selector.loading')}</div>
          ) : models.length === 0 ? (
            <div className="model-option disabled">{t('models.selector.noLLMs')}</div>
          ) : (
            <>
              <div 
                className={`model-option ${selectedModel === 'Auto' ? 'selected' : ''} ${!autoAvailable ? 'disabled' : ''}`}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={autoAvailable ? () => handleSelectModel('Auto') : undefined}
                onKeyDown={autoAvailable ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelectModel('Auto')
                  }
                } : undefined}
                role="button"
                tabIndex={autoAvailable ? 0 : -1}
                aria-disabled={!autoAvailable}
              >
                <span>{t('models.selector.auto')}</span>
                {autoAvailable && (
                  <button 
                    type="button"
                    className="auto-config-btn"
                    onClick={handleAutoConfigClick}
                    title={t('models.config.title')}
                  >
                    <BsGear size={16} />
                  </button>
                )}
              </div>
              {models.map((model) => (
                <div 
                  key={model.name}
                  className={`model-option ${selectedModel === model.name ? 'selected' : ''}`}
                  onClick={() => handleSelectModel(model.name)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleSelectModel(model.name)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {model.name}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {showInfoModal && (
        <div 
          className="info-modal-backdrop" 
          onClick={handleBackdropClick}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleCloseModal()
            }
          }}
          role="presentation"
        >
          <div className="info-modal">
            <button 
              className="info-modal-close"
              onClick={handleCloseModal}
              title={t('models.info.close')}
            >
              <MdClose size={24} />
            </button>
            <div className="info-modal-content">
              <p>{t('models.info.p1')}</p>
              <p>
                {t('models.info.p2_1')}{' '}
                <a 
                  href="https://ollama.com/library" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="info-link"
                >
                  {t('models.info.link')}
                </a>
                {t('models.info.p2_2')}
              </p>
              <p>{t('models.info.p3')}</p>
              <code className="info-code">{t('models.info.code')}</code>
              <p><br></br>{t('models.info.p4')}</p>
            </div>
          </div>
        </div>
      )}
      {showAutoConfigModal && (
        <div 
          className="info-modal-backdrop" 
          onClick={handleBackdropClick}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleCloseModal()
            }
          }}
          role="presentation"
        >
          <div className="info-modal">
            <button 
              className="info-modal-close"
              onClick={handleCloseModal}
              title={t('models.info.close')}
            >
              <MdClose size={24} />
            </button>
            <div className="info-modal-content">
              <h3>{t('models.config.title')}</h3>
              
              <div className="auto-config-option" style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                  <input 
                    type="radio" 
                    name="autoConfigType" 
                    checked={autoModeConfig?.type === 'default'}
                    onChange={() => onAutoModeConfigChange({ ...autoModeConfig, type: 'default' })}
                  />
                  <span>{t('models.config.default')}</span>
                </label>
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', opacity: 0.8, paddingLeft: '24px' }}>
                  {t('models.config.defaultDesc')}
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
                  <span>{t('models.config.custom')}</span>
                </label>
                
                {autoModeConfig?.type === 'custom' && (
                  <div style={{ marginTop: '1rem', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label htmlFor="vision-model-select" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t('models.config.visionModel')}</label>
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
                      <label htmlFor="coding-model-select" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t('models.config.codingModel')}</label>
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