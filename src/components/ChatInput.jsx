import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { IoSend } from 'react-icons/io5'
import { HiOutlineLightBulb, HiX, HiPencil, HiOutlineInformationCircle } from 'react-icons/hi'
import { BsDiagram2 } from 'react-icons/bs'
import { FiPlus } from 'react-icons/fi'
import { FaTrash } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import ModelSelector from './ModelSelector'
import ImageUploader from './ImageUploader'
import { fetchWithAuth } from '../services/api.service'
import '../css/ChatInput.css'

function ChatInput({ onSendMessage, isLoading, selectedModel, onModelChange, autoModeConfig, onAutoModeConfigChange, images, onImagesChange, initialInput = '', onInputClear = () => {}, currentChatId }) {
  const [input, setInput] = useState(initialInput)
  const [activeTemplateConfig, setActiveTemplateConfig] = useState(null)
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false)
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] = useState(false)
  const [newTemplateTitle, setNewTemplateTitle] = useState('')
  const [newTemplatePrompt, setNewTemplatePrompt] = useState('')
  const [templates, setTemplates] = useState([])
  const [editingTemplateId, setEditingTemplateId] = useState(null)
  const [contextMenu, setContextMenu] = useState({ isVisible: false, x: 0, y: 0, template: null })
  
  const textareaRef = useRef(null)
  const menuRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu.isVisible) setContextMenu(prev => ({ ...prev, isVisible: false }))
    }
    globalThis.addEventListener('click', handleGlobalClick)
    return () => globalThis.removeEventListener('click', handleGlobalClick)
  }, [contextMenu.isVisible])

  useEffect(() => {
    // Fetch plantillas
    const fetchTemplates = async () => {
      try {
        const response = await fetchWithAuth('http://localhost:3000/api/templates');
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
      const regex = /\[(.*?)\]/g;
      if (regex.test(initialInput)) {
        let match;
        let lastIndex = 0;
        const parts = [];
        const values = {};
        
        // Resetting regex index required after .test()
        regex.lastIndex = 0;
        while ((match = regex.exec(initialInput)) !== null) {
          if (match.index > lastIndex) {
            parts.push({ type: 'text', content: initialInput.substring(lastIndex, match.index), id: `text-${lastIndex}` });
          }
          const varId = match[0] + match.index;
          parts.push({ type: 'var', label: match[1], id: varId });
          values[varId] = '';
          lastIndex = match.index + match[0].length;
        }
        
        if (lastIndex < initialInput.length) {
          parts.push({ type: 'text', content: initialInput.substring(lastIndex), id: `text-${lastIndex}` });
        }
        
        setActiveTemplateConfig({ parts, values, original: initialInput });
        setInput('');
      } else {
        setActiveTemplateConfig(null);
        setInput(initialInput);
      }
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
    if (activeTemplateConfig) {
      const isComplete = activeTemplateConfig.parts.filter(p => p.type === 'var').every(p => activeTemplateConfig.values[p.id]?.trim());
      if (!isComplete) return; // No enviar si hay huecos sin rellenar
    }

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

  const handleCreateTemplate = async () => {
    if (!newTemplateTitle.trim() || !newTemplatePrompt.trim()) return;
    try {
      const isEditing = editingTemplateId !== null;
      const url = isEditing 
        ? `http://localhost:3000/api/templates/${encodeURIComponent(Number(editingTemplateId))}`
        : 'http://localhost:3000/api/templates';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetchWithAuth(url, {
        method,
        body: JSON.stringify({
          title: newTemplateTitle.trim(),
          prompt: newTemplatePrompt.trim()
        }),
      });
      if (response.ok) {
        const newData = await response.json();
        if (isEditing) {
          setTemplates(prev => prev.map(t => t.id === editingTemplateId ? newData : t));
        } else {
          setTemplates(prev => [...prev, newData]);
        }
        setIsCreateTemplateModalOpen(false);
        setEditingTemplateId(null);
        setNewTemplateTitle('');
        setNewTemplatePrompt('');
      } else {
        console.error('Error guardando plantilla: la respuesta del servidor no fue exitosa');
      }
    } catch (error) {
      console.error('Error procesando la plantilla', error);
    }
  }

  const handleContextMenu = (e, template) => {
    // Only show for user templates
    if (template.user_id) {
      e.preventDefault();
      setContextMenu({
        isVisible: true,
        x: e.pageX,
        y: e.pageY,
        template
      });
    }
  };

  const editTemplate = (template) => {
    setEditingTemplateId(template.id);
    setNewTemplateTitle(template.title);
    setNewTemplatePrompt(template.prompt);
    setIsTemplateMenuOpen(false);
    setIsCreateTemplateModalOpen(true);
  };

  const deleteTemplate = async (templateId) => {
    if (!globalThis.confirm('¿Seguro que quieres borrar esta plantilla?')) return;
    try {
      const response = await fetchWithAuth(`http://localhost:3000/api/templates/${encodeURIComponent(Number(templateId))}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
      }
    } catch (e) {
      console.error('Error borrando plantilla', e);
    }
  };

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
                <button 
                  type="button" 
                  className="create-template-btn" 
                  onClick={() => {
                    setIsTemplateMenuOpen(false);
                    setIsCreateTemplateModalOpen(true);
                    setEditingTemplateId(null);
                    setNewTemplateTitle('');
                    setNewTemplatePrompt('');
                  }}
                >
                  <FiPlus size={14} />
                  <span>Crear plantilla</span>
                </button>
                <span className="prompt-templates-title">Plantillas de Prompt</span>
                <button type="button" className="close-btn" onClick={() => setIsTemplateMenuOpen(false)}>
                  <HiX />
                </button>
              </div>
              <div className="prompt-templates-list">
                {templates.map((t, idx) => (
                  <button
                    key={t.id || idx}
                    type="button"
                    className="prompt-template-item"
                    onContextMenu={(e) => handleContextMenu(e, t)}
                    onClick={() => {
                      setIsTemplateMenuOpen(false)
                      
                      const regex = /\[(.*?)\]/g;
                      let match;
                      let lastIndex = 0;
                      const parts = [];
                      const values = {};
                      
                      while ((match = regex.exec(t.prompt)) !== null) {
                        if (match.index > lastIndex) {
                          parts.push({ type: 'text', content: t.prompt.substring(lastIndex, match.index), id: `text-${lastIndex}` });
                        }
                        const varId = match[0] + match.index;
                        parts.push({ type: 'var', id: varId, label: match[1] });
                        values[varId] = '';
                        lastIndex = regex.lastIndex;
                      }
                      if (lastIndex < t.prompt.length) {
                        parts.push({ type: 'text', content: t.prompt.substring(lastIndex), id: `text-${lastIndex}` });
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
              {activeTemplateConfig.parts.map((p) => (
                p.type === 'text' ? (
                  <span key={p.id}>{p.content}</span>
                ) : (
                  <span
                    key={p.id}
                    className="template-var-input"
                    contentEditable
                    suppressContentEditableWarning
                    data-placeholder={p.label}
                    tabIndex={0}
                    aria-label={p.label}
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

      {contextMenu.isVisible && createPortal(
        <div 
          className="template-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <button onClick={() => {
            editTemplate(contextMenu.template);
            setContextMenu(prev => ({ ...prev, isVisible: false }));
          }}>
             <HiPencil size={16} /> Editar
          </button>
          <button className="delete" onClick={() => {
            deleteTemplate(contextMenu.template.id);
            setContextMenu(prev => ({ ...prev, isVisible: false }));
          }}>
            <FaTrash size={14} /> Eliminar
          </button>
        </div>,
        document.body
      )}
      
      {isCreateTemplateModalOpen && createPortal(
        <div 
          className="template-modal-backdrop" 
          onClick={() => setIsCreateTemplateModalOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') setIsCreateTemplateModalOpen(false)
          }}
          aria-hidden="true"
        >
          <div 
            className="template-modal" 
            onClick={e => e.stopPropagation()}
            onKeyDown={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button className="template-modal-close" onClick={() => setIsCreateTemplateModalOpen(false)}>
              <HiX size={20} />
            </button>
            <h3 className="template-modal-title">{editingTemplateId ? 'Editar plantilla' : 'Crear plantilla'}</h3>
            
            <div className="template-modal-info">
              <HiOutlineInformationCircle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p>Para insertar campos a rellenar cuando uses la plantilla, escribe aquello que debería insertarse en el campo entre corchetes.</p>
                <p className="template-modal-example">Por ejemplo: <span>[Especificar Lenguaje]</span></p>
              </div>
            </div>

            <div className="template-modal-form">
              <input 
                type="text" 
                placeholder="Título de la plantilla" 
                value={newTemplateTitle}
                onChange={e => setNewTemplateTitle(e.target.value)}
                className="template-modal-input"
              />
              <textarea 
                placeholder="Escribe tu prompt con las [variables]..."
                value={newTemplatePrompt}
                onChange={e => setNewTemplatePrompt(e.target.value)}
                className="template-modal-textarea"
              />
              <button 
                type="button" 
                className="template-modal-submit"
                disabled={!newTemplateTitle.trim() || !newTemplatePrompt.trim()}
                onClick={handleCreateTemplate}
              >
                {editingTemplateId ? 'Guardar Cambios' : 'Crear'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

ChatInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  selectedModel: PropTypes.string.isRequired,
  onModelChange: PropTypes.func.isRequired,
  autoModeConfig: PropTypes.object,
  onAutoModeConfigChange: PropTypes.func,
  images: PropTypes.array.isRequired,
  onImagesChange: PropTypes.func.isRequired,
  initialInput: PropTypes.string,
  onInputClear: PropTypes.func,
  currentChatId: PropTypes.number
}

export default ChatInput
