import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useNodesState, useEdgesState } from '@xyflow/react'
import '../css/PlantUMLEditor.css'
import '../css/ReactFlowStyles.css'
import KrokiViewer from './KrokiViewer'
import ReactFlowViewer from './ReactFlowViewer'

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

  const [activeTab, setActiveTab] = useState('kroki') // 'kroki' | 'reactflow'
  
  // Estados para React Flow
  const [nodes, setNodes, onNodesChange] = useNodesState([
    { id: 'node-0', position: { x: 100, y: 100 }, data: { label: 'Inicio' } }
  ])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      return savedTheme === 'dark'
    }
    if (document.documentElement.hasAttribute('data-theme')) {
      return document.documentElement.getAttribute('data-theme') === 'dark'
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // Escuchar y aplicar cambios de tema
  useEffect(() => {
    // Asegurarse de que el atributo existe si se recarga la página
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
    
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark')
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })

    return () => observer.disconnect()
  }, [])

  const handleMouseDown = () => {
    setIsDragging(true)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    const containerWidth = window.innerWidth
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
      if (window.confirm('¿Estás seguro de que quieres cancelar? Se perderán los cambios en el código PlantUML.')) {
        navigate('/', { state: { returnToChatId: sourceChatId } })
      }
    } else {
      navigate('/', { state: { returnToChatId: sourceChatId } })
    }
  }

  const handleSave = () => {
    navigate('/', { 
      state: { 
        plantumlEdited: true,
        editedCode: code,
        returnToChatId: sourceChatId
      } 
    })
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'reactflow') {
      setLeftWidth(20)
    } else {
      setLeftWidth(50)
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
            disabled={!hasChanges}
          >
            Aceptar
          </button>
        </div>
      </header>

      <div className="plantuml-editor-content">
        <div className="plantuml-editor-left" style={{ width: `${leftWidth}%` }}>
          <div className="plantuml-editor-textarea-container">
            {/* The actual editable textarea with transparent text to allow syntax highlighting underneath/above */}
            <textarea
              ref={textareaRef}
              className="plantuml-textarea"
              value={code}
              onChange={handleCodeChange}
              onScroll={handleScroll}
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
                  paddingRight: '1.5rem',
                  paddingBottom: '1.5rem',
                  minHeight: '100%',
                }}
                codeTagProps={{
                  style: {
                    fontFamily: "'Fira Code', 'Courier New', monospace",
                    lineHeight: '1.5',
                    fontSize: '14px',
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
          onMouseDown={handleMouseDown}
          role="separator"
          tabIndex={0}
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
    </div>
  )
}

export default PlantUMLEditor
