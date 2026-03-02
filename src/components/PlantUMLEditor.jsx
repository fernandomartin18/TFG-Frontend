import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import '../css/PlantUMLEditor.css'

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
  
  // Variables para la renderización del diagrama
  const [diagramSvg, setDiagramSvg] = useState('')
  const [isRendering, setIsRendering] = useState(false)
  const [renderError, setRenderError] = useState(null)
  
  const hasChanges = code !== initialCode
  
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

  // Efecto para renderizar el diagrama con Kroki
  useEffect(() => {
    // Evitar renderizados constantes mientras se escribe (debounce 800ms)
    const timeoutId = setTimeout(async () => {
      if (!code.trim()) {
        setDiagramSvg('')
        setRenderError(null)
        return
      }

      setIsRendering(true)
      setRenderError(null)

      try {
        const response = await fetch('https://kroki.io/plantuml/svg', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
            'Accept': 'image/svg+xml'
          },
          body: code
        })

        if (!response.ok) {
          throw new Error('Error al procesar la sintaxis de PlantUML')
        }

        const svgContent = await response.text()
        setDiagramSvg(svgContent)
      } catch (err) {
        console.error('Error rendering diagram:', err)
        setRenderError('Error de sintaxis: No se pudo renderizar el diagrama PlantUML de forma válida.')
      } finally {
        setIsRendering(false)
      }
    }, 800)

    return () => clearTimeout(timeoutId)
  }, [code])

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

  const codeStyle = isDarkMode ? vscDarkPlus : vs

  return (
    <div className="plantuml-editor-container">
      <header className="plantuml-editor-header">
        <h1 className="plantuml-editor-title">Editor PlantUML</h1>
        <div className="plantuml-editor-actions">
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
              style={{ color: 'transparent', caretColor: isDarkMode ? '#fff' : '#000' }}
            />
            {/* Syntax highlighter behind/overlay the textarea */}
            <div 
              className="plantuml-highlighter-wrapper" 
              ref={highlighterRef}
            >
              <SyntaxHighlighter
                language="plantuml"
                style={codeStyle}cfcfd
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
        />

        <div className="plantuml-editor-right" style={{ width: `calc(100% - ${leftWidth}% - 8px)` }}>
          <div className="plantuml-viewer-container">
            {isRendering && <div className="plantuml-rendering-overlay">Renderizando...</div>}
            
            {renderError ? (
              <div className="plantuml-render-error">
                <p>{renderError}</p>
              </div>
            ) : (
              diagramSvg ? (
                <TransformWrapper
                  initialScale={1}
                  minScale={0.1}
                  maxScale={5}
                  centerOnInit={true}
                  wheel={{ step: 0.1 }}
                >
                  <TransformComponent wrapperClass="plantuml-transform-wrapper" contentClass="plantuml-transform-content">
                    <div 
                      className="plantuml-svg-wrapper"
                      dangerouslySetInnerHTML={{ __html: diagramSvg }}
                    />
                  </TransformComponent>
                </TransformWrapper>
              ) : (
                <div className="plantuml-render-error" style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: 'var(--text-color)' }}>
                  <p>El código está vacío. Escribe PlantUML para ver el diagrama.</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlantUMLEditor
