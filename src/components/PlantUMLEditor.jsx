import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useNodesState, useEdgesState } from '@xyflow/react'
import { HiPencil } from 'react-icons/hi'
import { FaTrash } from 'react-icons/fa'
import '../css/PlantUMLEditor.css'
import '../css/ReactFlowStyles.css'
import KrokiViewer from './KrokiViewer'
import ReactFlowViewer from './ReactFlowViewer'
import plantUmlService from '../services/plantuml.service'

function PlantUMLEditor() {
  const navigate = useNavigate()
  const location = useLocation()
  const textareaRef = useRef(null)
  const highlighterRef = useRef(null)
  const initialCode = location.state?.code || ''
  const sourceChatId = location.state?.chatId || null
  
  const [code, setCode] = useState(initialCode)
  const [leftWidth, setLeftWidth] = useState(50) // Percentage
  const [isDragging, setIsDragging] = useState(false)
  const hasChanges = code !== initialCode

  const [activeTab, setActiveTab] = useState('kroki') // 'kroki' | 'reactflow' | 'templates'
  
  // Templates state
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [errorTemplates, setErrorTemplates] = useState(null)
  
  // Creates template state
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState(null)
  const [newTemplateTitle, setNewTemplateTitle] = useState('')
  const [newTemplateCode, setNewTemplateCode] = useState('@startuml\n\n@enduml')
  const newTemplateTextareaRef = useRef(null)
  const newTemplateHighlighterRef = useRef(null)
  const [contextMenu, setContextMenu] = useState({ isVisible: false, x: 0, y: 0, template: null })

  // Estados para React Flow
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      return savedTheme === 'dark'
    }
    if ('theme' in document.documentElement.dataset) {
      return document.documentElement.dataset.theme === 'dark'
    }
    return globalThis.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // Escuchar y aplicar cambios de tema
  useEffect(() => {
    // ... theme logic
    // Asegurarse de que el atributo existe si se recarga la página
    document.documentElement.dataset.theme = isDarkMode ? 'dark' : 'light'
    
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.dataset.theme === 'dark')
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu.isVisible) setContextMenu(prev => ({ ...prev, isVisible: false }))
    }
    globalThis.addEventListener('click', handleGlobalClick)
    return () => globalThis.removeEventListener('click', handleGlobalClick)
  }, [contextMenu.isVisible])

  // Fetch templates when tab is 'templates'
  useEffect(() => {
    if (activeTab === 'templates' && templates.length === 0 && !isLoadingTemplates) {
      const loadTemplates = async () => {
        setIsLoadingTemplates(true)
        setErrorTemplates(null)
        try {
          const res = await plantUmlService.getTemplates()
          if (res.success) {
            setTemplates(res.templates || [])
          }
        } catch (err) {
          setErrorTemplates(err.message)
        } finally {
          setIsLoadingTemplates(false)
        }
      }
      loadTemplates()
    }
  }, [activeTab, templates.length])

  const handleMouseDown = () => {
    setIsDragging(true)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    const containerWidth = globalThis.innerWidth
    const newWidthPercentage = (e.clientX / containerWidth) * 100
    
    // Limits
    if (newWidthPercentage > 20 && newWidthPercentage < 80) {
      setLeftWidth(newWidthPercentage)
    }
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const handleCodeChange = (e) => {
    setCode(e.target.value)
  }

  const handleScroll = (e) => {
    // Sincronizar el scroll del textarea con el resaltador de sintaxis
    if (highlighterRef.current) {
      highlighterRef.current.scrollTop = e.target.scrollTop;
      highlighterRef.current.scrollLeft = e.target.scrollLeft;
    }
  }

  const handleCancel = () => {
    if (code !== initialCode) {
      if (globalThis.confirm('¿Estás seguro de que quieres cancelar? Se perderán los cambios en el código PlantUML.')) {
        navigate('/', { state: { returnToChatId: sourceChatId } })
      }
    } else {
      navigate('/', { state: { returnToChatId: sourceChatId } })
    }
  }

  const handleSave = () => {
    navigate('/', { 
      state: { 
        plantumlCreated: location.state?.createNew,
        plantumlEdited: !location.state?.createNew,
        editedCode: code,
        returnToChatId: sourceChatId
      } 
    })
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'reactflow') {
      setLeftWidth(20)
    } else if (tab === 'templates') {
      setLeftWidth(25)
      setIsCreatingTemplate(false) // Al cambiar a / desde templates, cancelamos modo crear.
    } else {
      setLeftWidth(50)
    }
  }

  const handleUseTemplate = () => {
    if (selectedTemplate && !isCreatingTemplate) {
      setCode(selectedTemplate.code)
      setActiveTab('kroki')
      setLeftWidth(50)
    }
  }
  
  const handleContextMenu = (e, template) => {
    if (template.userId) {
      e.preventDefault(); 
      setContextMenu({
        isVisible: true,
        x: e.pageX,
        y: e.pageY,
        template
      });
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!globalThis.confirm('¿Seguro que quieres borrar esta plantilla?')) return;
    try {
      const res = await plantUmlService.deleteTemplate(templateId);
      if (res.success) {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        if (selectedTemplate?.id === templateId) {
          setSelectedTemplate(null);
        }
      }
    } catch (e) {
      alert('Error borrando plantilla: ' + e.message);
    }
  };
  
  const handleSaveTemplate = async () => {
    if (!newTemplateTitle.trim() || !newTemplateCode.trim()) {
      alert("Por favor, pon un título y un código a tu plantilla.");
      return;
    }
    try {
      setIsLoadingTemplates(true);
      if (editingTemplateId) {
        const res = await plantUmlService.updateTemplate(editingTemplateId, {
          title: newTemplateTitle,
          code: newTemplateCode
        });
        if (res.success) {
          setTemplates(prev => prev.map(t => t.id === editingTemplateId ? res.template : t));
          setSelectedTemplate(res.template);
          setIsCreatingTemplate(false);
          setEditingTemplateId(null);
        }
      } else {
        const res = await plantUmlService.createTemplate({
          title: newTemplateTitle,
          code: newTemplateCode
        });
        if (res.success) {
          setTemplates(prev => [res.template, ...prev]);
          setSelectedTemplate(res.template);
          setIsCreatingTemplate(false);
        }
      }
    } catch(err) {
      alert("Error al guardar la plantilla: " + err.message);
    } finally {
      setIsLoadingTemplates(false);
    }
  }
  
  const handleNewTemplateScroll = (e) => {
    if (newTemplateHighlighterRef.current) {
      newTemplateHighlighterRef.current.scrollTop = e.target.scrollTop;
      newTemplateHighlighterRef.current.scrollLeft = e.target.scrollLeft;
    }
  }

  const codeStyle = isDarkMode ? vscDarkPlus : vs

  return (
    <div className="plantuml-editor-container">
      <header className="plantuml-editor-header">
        <div style={{ flex: 1 }}>
          <h1 className="plantuml-editor-title">Editor PlantUML</h1>
        </div>
        <div className="view-mode-tabs" style={{ display: 'flex', justifyContent: 'center', flex: 1, margin: 0, gap: '2rem' }}>
          {location.state?.createNew && (
            <button 
              className={`view-mode-tab ${activeTab === 'templates' ? 'active' : ''}`}
              onClick={() => handleTabChange('templates')}
            >
              Plantillas
            </button>
          )}
          <button 
            className={`view-mode-tab ${activeTab === 'kroki' ? 'active' : ''}`}
            onClick={() => handleTabChange('kroki')}
          >
            Código
          </button>
          <button 
            className={`view-mode-tab ${activeTab === 'reactflow' ? 'active' : ''}`}
            onClick={() => handleTabChange('reactflow')}
          >
            Diagrama
          </button>
        </div>
        <div className="plantuml-editor-actions" style={{ flex: 1, justifyContent: 'flex-end' }}>
          <button className="plantuml-btn plantuml-btn-cancel" onClick={handleCancel}>
            Cancelar
          </button>
          <button 
            className="plantuml-btn plantuml-btn-save" 
            onClick={handleSave}
            disabled={activeTab === 'templates' || (!hasChanges && !location.state?.createNew)}
          >
            Aceptar
          </button>
        </div>
      </header>

      <div className="plantuml-editor-content">
        {activeTab === 'templates' ? (
          <div className="plantuml-templates-view" style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
            {contextMenu.isVisible && createPortal(
              <div 
                role="presentation"
                className="template-context-menu"
                style={{ top: contextMenu.y, left: contextMenu.x, position: 'absolute', zIndex: 100000, background: isDarkMode ? '#1e1e1e' : '#ffffff', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', minWidth: '120px' }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <button 
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-color)', textAlign: 'left', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '4px' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => {
                    setEditingTemplateId(contextMenu.template.id);
                    setNewTemplateTitle(contextMenu.template.title);
                    setNewTemplateCode(contextMenu.template.code);
                    setIsCreatingTemplate(true);
                    setContextMenu(prev => ({ ...prev, isVisible: false }));
                    setSelectedTemplate(null);
                  }}>
                   <HiPencil size={16} /> Editar
                </button>
                <button 
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', textAlign: 'left', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '4px' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => {
                    handleDeleteTemplate(contextMenu.template.id);
                    setContextMenu(prev => ({ ...prev, isVisible: false }));
                  }}>
                  <FaTrash size={14} /> Eliminar
                </button>
              </div>,
              document.body
            )}
            
            {/* Lista de plantillas - 25% width */}
            <div className="templates-list-pane" style={{ width: '25%', height: '100%', borderRight: '1px solid var(--border-color)', overflowY: 'auto', background: 'var(--panel-bg)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {isLoadingTemplates && <p style={{ color: 'var(--text-color)' }}>Cargando...</p>}
              {errorTemplates && <p style={{ color: 'var(--error-color)' }}>{errorTemplates}</p>}
              {!isLoadingTemplates && templates.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No hay plantillas disponibles.</p>}
              
              {isCreatingTemplate && !editingTemplateId && (
                <div
                  className="template-item active-creation"
                  style={{
                    padding: '0.8rem',
                    borderRadius: '8px',
                    background: 'var(--input-bg)',
                    color: 'var(--text-color)',
                    border: '2px solid var(--accent-color)',
                    boxShadow: '0 0 8px rgba(139, 92, 246, 0.5)',
                  }}
                >
                  <input 
                    type="text"
                    value={newTemplateTitle}
                    onChange={(e) => setNewTemplateTitle(e.target.value)}
                    placeholder="Escribe el título..."
                    autoFocus
                    style={{
                      width: '100%', border: 'none', background: 'transparent',
                      color: 'var(--text-color)', outline: 'none', fontSize: '1rem',
                      fontWeight: 'bold', borderBottom: '1px solid var(--border-color)'
                    }}
                  />
                </div>
              )}
              
              {templates.map(tpl => {
                const isEditingThis = isCreatingTemplate && editingTemplateId === tpl.id;
                
                return (
                <div 
                  key={tpl.id} 
                  className={`template-item ${selectedTemplate?.id === tpl.id && !isEditingThis ? 'selected' : ''}`}
                  onClick={() => !isEditingThis && setSelectedTemplate(tpl)}
                  onContextMenu={(e) => !isEditingThis && handleContextMenu(e, tpl)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault(); 
                      if (!isEditingThis) setSelectedTemplate(tpl);
                    }
                  }}
                  role="button"
                  tabIndex={isEditingThis ? -1 : 0}
                  style={{
                    padding: '0.8rem',
                    borderRadius: '8px',
                    cursor: isEditingThis ? 'default' : 'pointer',
                    background: isEditingThis ? 'var(--input-bg)' : (selectedTemplate?.id === tpl.id ? '#8b5cf6' : 'var(--input-bg)'),
                    color: isEditingThis ? 'var(--text-color)' : (selectedTemplate?.id === tpl.id ? 'white' : 'var(--text-color)'),
                    border: isEditingThis ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                    boxShadow: isEditingThis ? '0 0 8px rgba(139, 92, 246, 0.5)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isEditingThis ? (
                    <input 
                      type="text"
                      value={newTemplateTitle}
                      onChange={(e) => setNewTemplateTitle(e.target.value)}
                      placeholder="Escribe el título..."
                      autoFocus
                      style={{
                        width: '100%', border: 'none', background: 'transparent',
                        color: 'var(--text-color)', outline: 'none', fontSize: '1rem',
                        fontWeight: 'bold', borderBottom: '1px solid var(--border-color)'
                      }}
                    />
                  ) : (
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>{tpl.title}</h3>
                  )}
                </div>
              )})}
              {/* Botón flotante lado inferior izquierdo */}
              {isCreatingTemplate ? (
                <button 
                  className="plantuml-btn plantuml-btn-cancel"
                  onClick={() => {
                    setIsCreatingTemplate(false);
                    setEditingTemplateId(null);
                  }}
                  style={{
                    position: 'absolute', bottom: '2rem', left: '2rem', zIndex: 10,
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    padding: '0.8rem 1.5rem', fontSize: '1.1rem',
                  }}
                >
                  Cancelar
                </button>
              ) : (
                <button 
                  className="plantuml-btn"
                  onClick={() => {
                    setIsCreatingTemplate(true);
                    setNewTemplateTitle('Mi nueva plantilla');
                    setNewTemplateCode('@startuml\n\n@enduml');
                    setSelectedTemplate(null);
                  }}
                  style={{
                    position: 'absolute', bottom: '2rem', left: '2rem', zIndex: 10,
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)', background: 'var(--primary-color)', color: 'white',
                    border: 'none', padding: '0.8rem 1.5rem', fontSize: '1.1rem', borderRadius: '6px', cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>+</span> Nueva plantilla
                </button>
              )}
            </div>

            {/* Editor de código central - 37.5% width */}
            <div className="template-code-pane" style={{ width: '37.5%', height: '100%', borderRight: '1px solid var(--border-color)', position: 'relative' }}>
              <div className="plantuml-editor-textarea-container" style={{ margin: 0, height: '100%', position: 'relative' }}>
                {isCreatingTemplate ? (
                  <>
                    <textarea
                      ref={newTemplateTextareaRef}
                      className="plantuml-textarea"
                      value={newTemplateCode}
                      onChange={(e) => setNewTemplateCode(e.target.value)}
                      onScroll={handleNewTemplateScroll}
                      placeholder="Escribe aquí tu código PlantUML..."
                      spellCheck="false"
                      style={{ 
                        color: 'transparent', caretColor: isDarkMode ? '#fff' : '#000',
                        opacity: 1, width: '100%', height: '100%', resize: 'none',
                        position: 'absolute', top: 0, left: 0, zIndex: 2, background: 'transparent',
                        fontFamily: "'Fira Code', 'Courier New', Courier, monospace",
                        lineHeight: '1.5', fontSize: '14px', whiteSpace: 'pre', padding: '1rem'
                      }}
                    />
                    <div 
                      className="plantuml-highlighter-wrapper" 
                      ref={newTemplateHighlighterRef}
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}
                    >
                      <SyntaxHighlighter
                        language="plantuml"
                        style={codeStyle}
                        className="plantuml-highlighter"
                        customStyle={{
                          backgroundColor: 'var(--panel-bg)',
                          margin: 0, padding: '1rem', height: '100%', boxSizing: 'border-box',
                          whiteSpace: 'pre', wordBreak: 'normal', overflowWrap: 'normal',
                        }}
                        codeTagProps={{
                          style: {
                            fontFamily: "'Fira Code', 'Courier New', Courier, monospace",
                            lineHeight: '1.5', fontSize: '14px', whiteSpace: 'pre',
                          }
                        }}
                      >
                        {newTemplateCode}
                      </SyntaxHighlighter>
                    </div>
                  </>
                ) : selectedTemplate ? (
                  <SyntaxHighlighter
                    language="plantuml"
                    style={codeStyle}
                    className="plantuml-highlighter"
                    customStyle={{
                      backgroundColor: 'var(--panel-bg)',
                      margin: 0,
                      padding: '1rem',
                      height: '100%',
                      boxSizing: 'border-box',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                    }}
                    codeTagProps={{
                      style: {
                        fontFamily: "'Fira Code', 'Courier New', Courier, monospace",
                        lineHeight: '1.5',
                        fontSize: '14px',
                        whiteSpace: 'pre-wrap',
                      }
                    }}
                  >
                    {selectedTemplate.code}
                  </SyntaxHighlighter>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                    Selecciona una plantilla para ver su código
                  </div>
                )}
              </div>
            </div>

            {/* Visor Kroki derecha - 37.5% width */}
            <div className="template-preview-pane" style={{ width: '37.5%', height: '100%', position: 'relative' }}>
              <div className="plantuml-viewer-container" style={{ borderRadius: 0, margin: 0, height: '100%' }}>
                {isCreatingTemplate ? (
                  <KrokiViewer code={newTemplateCode} />
                ) : selectedTemplate ? (
                  <KrokiViewer code={selectedTemplate.code} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                    El diagrama aparecerá aquí
                  </div>
                )}
              </div>
              
              {/* Botón flotante derecho */}
              {isCreatingTemplate ? (
                <button 
                  className="plantuml-btn plantuml-btn-save"
                  onClick={handleSaveTemplate}
                  style={{
                    position: 'absolute', bottom: '2rem', right: '2rem', zIndex: 10,
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    padding: '0.8rem 1.5rem', fontSize: '1.1rem',
                  }}
                >
                  Guardar
                </button>
              ) : selectedTemplate && (
                <button 
                  className="plantuml-btn plantuml-btn-save"
                  onClick={handleUseTemplate}
                  style={{
                    position: 'absolute', bottom: '2rem', right: '2rem', zIndex: 10,
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    padding: '0.8rem 1.5rem', fontSize: '1.1rem'
                  }}
                >
                  Usar <span>➔</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', width: '100%', height: '100%' }}>
            <div className="plantuml-editor-left" style={{ width: `${leftWidth}%` }}>
              <div className="plantuml-editor-textarea-container">
                {/* The actual editable textarea with transparent text to allow syntax highlighting underneath/above */}
                <textarea
                  ref={textareaRef}
                  className="plantuml-textarea"
                  value={code}
                  onChange={handleCodeChange}
                  onScroll={handleScroll}
                  placeholder="Escribe aquí tu código PlantUML..."
                  spellCheck="false"
                  readOnly={activeTab === 'reactflow'}
                  style={{ 
                    color: 'transparent', 
                    caretColor: isDarkMode ? '#fff' : '#000',
                    opacity: activeTab === 'reactflow' ? 0.7 : 1,
                    cursor: activeTab === 'reactflow' ? 'not-allowed' : 'text'
                  }}
                />
                {/* Syntax highlighter behind/overlay the textarea */}
                <div 
                  className="plantuml-highlighter-wrapper" 
                  ref={highlighterRef}
                >
                  <SyntaxHighlighter
                    language="plantuml"
                    style={codeStyle}
                    className="plantuml-highlighter"
                    customStyle={{
                      backgroundColor: 'transparent',
                      margin: 0,
                      padding: '1rem',
                      paddingRight: '3rem',
                      paddingBottom: '3rem',
                      minHeight: '100%',
                      whiteSpace: 'pre',
                      wordBreak: 'normal',
                      overflowWrap: 'normal',
                    }}
                    codeTagProps={{
                      style: {
                        fontFamily: "'Fira Code', 'Courier New', Courier, monospace",
                        lineHeight: '1.5',
                        fontSize: '14px',
                        whiteSpace: 'pre',
                      }
                    }}
                  >
                    {code}
                  </SyntaxHighlighter>
                </div>
              </div>
            </div>

            <div 
              className={`plantuml-resizer ${isDragging ? 'dragging' : ''}`} 
              onPointerDown={handleMouseDown}
              role="separator"
              aria-valuenow={leftWidth}
            />

            <div className="plantuml-editor-right" style={{ width: `calc(100% - ${leftWidth}% - 8px)` }}>
              <div className="plantuml-viewer-container">
                {activeTab === 'kroki' ? (
                  <KrokiViewer code={code} />
                ) : (
                  <ReactFlowViewer 
                    isDarkMode={isDarkMode}
                    nodes={nodes}
                    setNodes={setNodes}
                    onNodesChange={onNodesChange}
                    edges={edges}
                    setEdges={setEdges}
                    onEdgesChange={onEdgesChange}
                    setCode={setCode}
                    setActiveTab={setActiveTab}
                    code={code}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlantUMLEditor
