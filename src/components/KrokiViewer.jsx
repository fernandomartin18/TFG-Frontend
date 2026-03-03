import { useState, useEffect } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

function KrokiViewer({ code }) {
  const [diagramSvg, setDiagramSvg] = useState('')
  const [isRendering, setIsRendering] = useState(false)
  const [renderError, setRenderError] = useState(null)

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

  return (
    <>
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
    </>
  )
}

export default KrokiViewer
