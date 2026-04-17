import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { IoSend } from 'react-icons/io5'
import { HiOutlineLightBulb, HiX, HiPencil } from 'react-icons/hi'
import { BsDiagram2 } from 'react-icons/bs'
import { FiPlus } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import ModelSelector from './ModelSelector'
import ImageUploader from './ImageUploader'
import '../css/ChatInput.css'

function ChatInput({ onSendMessage, isLoading, selectedModel, onModelChange, autoModeConfig, onAutoModeConfigChange, images, onImagesChange, initialInput = '', onInputClear = () => {}, currentChatId }) {
  const [input, setInput] = useState(initialInput)
  const [activeTemplateConfig, setActiveTemplateConfig] = useState(null)
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false)
  const [templates, setTemplates] = useState([])
  const textareaRef = useRef(null)
  const menuRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch plantillas
    const fetchTemplates = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/templates');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data);
        } else {
          console.error("Error fetching templates, status:", response.status);
        }
      } catch (error) {
        console.error("Error fetching templates:", error);
      }
    };
    fetchTemplates();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsTemplateMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  useEffect(() => {
    if (initialInput) {
      setInput(initialInput)
    }
  }, [initialInput])

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      // Altura del textarea basada en scrollHeight, con un máximo de 8 líneas
      const lineHeight = 24 // 1.5em * 16px
      const maxHeight = lineHeight * 8 + 24 // 8 lines + padding
      const newHeight = Math.min(textarea.scrollHeight, maxHeight)
      textarea.style.height = `${newHeight}px`
      
      // Habilitar scroll solo cuando el contenido excede la altura máxima
      if (textarea.scrollHeight > maxHeight) {
        textarea.style.overflowY = 'scroll'
      } else {
        textarea.style.overflowY = 'hidden'
      }
    }
  }, [input])

  const handleSend = () => {
    let finalInput = input;
    if (activeTemplateConfig) {
      finalInput = activeTemplateConfig.parts.map(p => 
        p.type === 'var' ? (activeTemplateConfig.values[p.id] || `[${p.label}]`) : p.content
      ).join('');
    }

    if (finalInput.trim() && !isLoading) {
      onSendMessage(finalInput)
      setInput('')
      setActiveTemplateConfig(null)
      if (onInputClear) onInputClear()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-input-container">
      <div className="chat-input-form">
        <div className="image-uploader-group" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <button
            type="button"
            className="add-image-button"
            onClick={() => navigate('/editor', { state: { createNew: true, chatId: currentChatId } })}
            title="Crear diagrama PlantUML"
            style={{ position: 'relative' }}
          >
            <BsDiagram2 size={24} />
            <FiPlus 
              size={12} 
              style={{ 
                position: 'absolute', 
                bottom: '10px', 
                right: '9px',
                strokeWidth: 4,
                backgroundColor: 'var(--input-bg)',
                borderRadius: '50%'
              }} 
            />
          </button>
          <ImageUploader 
            images={images}
            onImagesChange={onImagesChange}
            selectedModel={selectedModel}
          />
        </div>
        <div className="textarea-wrapper" ref={menuRef}>
          {isTemplateMenuOpen && (
            <div className="prompt-templates-dropdown">
              <div className="prompt-templates-header">
                <span>Plantillas de Prompt</span>
                <button type="button" onClick={() => setIsTemplateMenuOpen(false)}>
                  <HiX />
                </button>
              </div>
              <div className="prompt-templates-list">
                {templates.map((t, idx) => (
                  <button
                    key={t.id || idx}
                    type="button"
                    className="prompt-template-item"
                    onClick={() => {
                      setIsTemplateMenuOpen(false)
                      
                      const regex = /\[(.*?)\]/g;
                      let match;
                      let lastIndex = 0;
                      const parts = [];
                      const values = {};
                      
                      while ((match = regex.exec(t.prompt)) !== null) {
                        if (match.index > lastIndex) {
                          parts.push({ type: 'text', content: t.prompt.substring(lastIndex, match.index) });
                        }
                        const varId = match[0] + match.index;
                        parts.push({ type: 'var', id: varId, label: match[1] });
                        values[varId] = '';
                        lastIndex = regex.lastIndex;
                      }
                      if (lastIndex < t.prompt.length) {
                        parts.push({ type: 'text', content: t.prompt.substring(lastIndex) });
                      }

                      if (parts.some(p => p.type === 'var')) {
                        setActiveTemplateConfig({ parts, values, original: t.prompt });
                        setInput('');
                      } else {
                        setActiveTemplateConfig(null);
                        setInput(t.prompt);
                        setTimeout(() => textareaRef.current?.focus(), 10);
                      }
                    }}
                  >
                    <strong>{t.title}</strong>
                    <div style={{fontSize: '0.8rem', opacity: 0.7, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                      {t.prompt}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {activeTemplateConfig ? (
            <div className="chat-input template-active-box">
              {activeTemplateConfig.parts.map((p, i) => (
                p.type === 'text' ? (
                  <span key={i}>{p.content}</span>
                ) : (
                  <span
                    key={i}
                    className="template-var-input"
                    contentEditable
                    suppressContentEditableWarning
                    data-placeholder={p.label}
                    onInput={(e) => {
                      const val = e.currentTarget.innerText;
                      setActiveTemplateConfig(prev => ({
                          ...prev,
                          values: { ...prev.values, [p.id]: val }
                      }))
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                      }
                    }}
                  />
                )
              ))}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje..."
              className="chat-input"
              rows={1}
            />
          )}

          <div className="input-actions">
            {activeTemplateConfig && (
              <button 
                type="button"
                className="edit-text-btn"
                title="Editar como texto libre"
                onClick={() => {
                  const text = activeTemplateConfig.parts.map(p => p.type === 'var' ? (activeTemplateConfig.values[p.id] || `[${p.label}]`) : p.content).join('');
                  setInput(text);
                  setActiveTemplateConfig(null);
                  setTimeout(() => textareaRef.current?.focus(), 10);
                }}
              >
                <HiPencil size={16} />
                <span>Editar como texto</span>
              </button>
            )}
            <button 
              type="button" 
              className="action-icon-btn" 
              onClick={() => setIsTemplateMenuOpen(prev => !prev)}
              title="Ver plantillas"
            >
              <HiOutlineLightBulb size={22} />
            </button>
          </div>
        </div>
        <div className="controls-group">
          <ModelSelector 
            selectedModel={selectedModel}
            onModelChange={onModelChange}
            autoModeConfig={autoModeConfig}
            onAutoModeConfigChange={onAutoModeConfigChange}
          />
          <button 
            type="button" 
            onClick={handleSend}
            className="send-button"
            disabled={isLoading || (activeTemplateConfig 
              ? !activeTemplateConfig.parts.filter(p => p.type === 'var').every(p => activeTemplateConfig.values[p.id]?.trim()) 
              : !input.trim())}
          >
            <IoSend size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

ChatInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  selectedModel: PropTypes.string.isRequired,
  onModelChange: PropTypes.func.isRequired,
  images: PropTypes.array.isRequired,
  onImagesChange: PropTypes.func.isRequired,
  initialInput: PropTypes.string,
  onInputClear: PropTypes.func,
  currentChatId: PropTypes.number
}

export default ChatInput
