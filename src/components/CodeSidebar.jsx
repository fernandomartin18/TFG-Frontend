import { useState } from 'react'
import PropTypes from 'prop-types'
import { IoIosArrowBack } from 'react-icons/io'
import { MdDownload } from 'react-icons/md'
import JSZip from 'jszip'
import CodeModal from './CodeModal'
import '../css/CodeSidebar.css'

function CodeSidebar({ codeRequests }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCode, setSelectedCode] = useState(null)

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const openCodeModal = (code, language, requestIndex, codeIndex) => {
    setSelectedCode({
      content: code,
      language: language,
      requestIndex: requestIndex,
      codeIndex: codeIndex
    })
  }

  const closeCodeModal = () => {
    setSelectedCode(null)
  }

  const handleCodeClick = (e, code, language, requestIndex, codeIndex) => {
    // Si el click fue en el botón de descarga, no abrir el modal
    if (e.target.closest('.download-code-button')) {
      return
    }
    openCodeModal(code, language, requestIndex, codeIndex)
  }

  const generateDescriptiveName = (code, language, userMessage = '') => {
    // Intentar detectar nombres de archivos, clases o funciones en el código
    let detectedName = ''
    
    // Buscar nombre de clase
    const classMatch = code.match(/class\s+([A-Z][a-zA-Z0-9_]*)/i)
    if (classMatch) {
      detectedName = classMatch[1]
    }
    
    // Buscar nombre de función principal
    if (!detectedName) {
      const functionMatch = code.match(/(?:function|def|const|let|var)\s+([a-zA-Z][a-zA-Z0-9_]*)/i)
      if (functionMatch) {
        detectedName = functionMatch[1]
      }
    }
    
    // Buscar componente React
    if (!detectedName && (language === 'jsx' || language === 'tsx')) {
      const componentMatch = code.match(/(?:export\s+(?:default\s+)?)?(?:function|const)\s+([A-Z][a-zA-Z0-9_]*)/i)
      if (componentMatch) {
        detectedName = componentMatch[1]
      }
    }
    
    // Buscar título en HTML
    if (!detectedName && language === 'html') {
      const titleMatch = code.match(/<title>(.*?)<\/title>/i)
      if (titleMatch) {
        detectedName = titleMatch[1].trim().replace(/\s+/g, '_')
      }
    }
    
    if (detectedName) {
      return detectedName
    }
    
    // Si no se encuentra nada, usar un nombre genérico basado en el contexto
    if (userMessage) {
      // Filtrar palabras comunes y extraer palabras significativas
      const stopWords = ['dame', 'ahora', 'genera', 'crea', 'haz', 'hacer', 'crear', 'generar', 
                        'código', 'codigo', 'para', 'que', 'una', 'uno', 'con', 'por', 'los', 'las',
                        'del', 'the', 'and', 'code', 'make', 'create', 'generate', 'escribe', 'write',
                        'file', 'give', 'me', 'now', 'some', 'code', 'codes', 'of', 'in']
      
      const words = userMessage.toLowerCase()
        .match(/\b[a-záéíóúñ]{3,}\b/gi) || []
      
      const meaningfulWords = words
        .filter(word => !stopWords.includes(word.toLowerCase()))
        .slice(0, 3)
      
      if (meaningfulWords.length > 0) {
        return meaningfulWords.join('_')
      }
    }
    
    // Si no hay nada, nombre genérico
    return 'code'
  }

  const generateRequestTitle = (codes, userMessage) => {
    // Si solo hay un código, usar su nombre
    if (codes.length === 1) {
      const name = generateDescriptiveName(codes[0].content, codes[0].language, userMessage)
      return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
    
    // Para múltiples códigos, obtener nombres de todos
    const codeNames = codes.map(code => 
      generateDescriptiveName(code.content, code.language, userMessage)
    )

    const uniqueNames = [...new Set(codeNames)]
    const hasGenericNames = codeNames.some(name => name === 'code' || name.includes('_'))
    
    if (uniqueNames.length === codes.length && !hasGenericNames && codes.length <= 3) {
      const displayNames = codeNames
        .map(name => name.charAt(0).toUpperCase() + name.slice(1))
        .join(' y ')
      return `${displayNames} (${codes.length} archivos)`
    }
    
    // Si hay múltiples códigos del mismo lenguaje
    const languages = codes.map(c => c.language)
    const uniqueLanguages = [...new Set(languages)]
    
    if (uniqueLanguages.length === 1) {
      const lang = uniqueLanguages[0] || 'Code'
      return `${lang.charAt(0).toUpperCase() + lang.slice(1)} Files (${codes.length})`
    }
    
    // Intentar extraer el tema principal del mensaje del usuario
    if (userMessage) {
      // Filtrar palabras comunes y extraer el tema
      const stopWords = ['dame', 'ahora', 'genera', 'crea', 'haz', 'hacer', 'crear', 'generar', 
                        'código', 'codigo', 'para', 'que', 'una', 'uno', 'con', 'por', 'los', 'las',
                        'del', 'the', 'and', 'code', 'make', 'create', 'generate', 'escribe', 'write',
                        'file', 'give', 'me', 'now', 'some', 'code', 'codes', 'of', 'in']
      
      const words = userMessage.toLowerCase()
        .match(/\b[a-záéíóúñ]{3,}\b/gi) || []
      
      const meaningfulWords = words
        .filter(word => !stopWords.includes(word.toLowerCase()))
        .slice(0, 3)
      
      if (meaningfulWords.length > 0) {
        const title = meaningfulWords
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        return `${title} (${codes.length} archivos)`
      }
    }
    
    // Por defecto, usar los lenguajes
    return `Mixed Code (${codes.length} archivos)`
  }

  const downloadCode = (code, language, fileName) => {
    const extension = getFileExtension(language)
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${fileName}.${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const downloadAllCodes = async (requestIndex, codes, userMessage) => {
    // Generar nombre base descriptivo
    const baseName = generateDescriptiveName(codes[0].content, codes[0].language, userMessage)
    
    // Si solo hay un código, descargar directamente sin ZIP
    if (codes.length === 1) {
      downloadCode(codes[0].content, codes[0].language, baseName)
      return
    }

    // Si hay múltiples códigos, crear un ZIP
    const zip = new JSZip()
    
    codes.forEach((code, index) => {
      const individualName = generateDescriptiveName(code.content, code.language, userMessage)
      const extension = getFileExtension(code.language)
      const fileName = `${individualName}.${extension}`
      zip.file(fileName, code.content)
    })

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // Nombre del ZIP basado en el contexto
    const zipName = userMessage 
      ? userMessage.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_') 
      : baseName
    link.download = `${zipName}.zip`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getFileExtension = (language) => {
    const extensions = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      csharp: 'cs',
      ruby: 'rb',
      go: 'go',
      rust: 'rs',
      php: 'php',
      swift: 'swift',
      kotlin: 'kt',
      html: 'html',
      css: 'css',
      sql: 'sql',
      bash: 'sh',
      shell: 'sh',
      json: 'json',
      xml: 'xml',
      yaml: 'yml',
      markdown: 'md',
      jsx: 'jsx',
      tsx: 'tsx',
      vue: 'vue'
    }
    return extensions[language?.toLowerCase()] || 'txt'
  }

  // No mostrar el botón si no hay ninguna petición con código
  if (codeRequests.length === 0) {
    return null
  }

  return (
    <>
      {/* Botón de toggle */}
      <button
        className={`sidebar-toggle-button ${isOpen ? 'open' : ''}`}
        onClick={toggleSidebar}
        aria-label={isOpen ? 'Cerrar panel' : 'Abrir panel'}
      >
        <IoIosArrowBack className={`toggle-icon ${isOpen ? 'rotated' : ''}`} />
      </button>

      {/* Panel lateral */}
      <div className={`code-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          {codeRequests.map((request, requestIndex) => (
            <div key={requestIndex} className="code-request-section">
              <div className="request-header">
                <h3 className="request-title">
                  {generateRequestTitle(request.codes, request.userMessage)}
                </h3>
                <button
                  className="download-all-button"
                  onClick={() => downloadAllCodes(requestIndex, request.codes, request.userMessage)}
                  title={request.codes.length === 1 ? 'Descargar código' : 'Descargar todos los códigos'}
                >
                  <MdDownload />
                </button>
              </div>

              <div className="codes-list">
                {request.codes.map((code, codeIndex) => (
                  <div 
                    key={codeIndex} 
                    className="code-item"
                    onClick={(e) => handleCodeClick(e, code.content, code.language, requestIndex, codeIndex)}
                  >
                    <div className="code-item-header">
                      <span className="code-language">{code.language || 'text'}</span>
                      <button
                        className="download-code-button"
                        onClick={() => {
                          const fileName = generateDescriptiveName(code.content, code.language, request.userMessage)
                          downloadCode(code.content, code.language, fileName)
                        }}
                        title="Descargar código"
                      >
                        <MdDownload />
                      </button>
                    </div>
                    <pre className="code-preview">
                      <code>{code.content.substring(0, 150)}...</code>
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal para ver el código */}
      {selectedCode && (
        <CodeModal
          code={selectedCode.content}
          language={selectedCode.language}
          onClose={closeCodeModal}
          onDownload={() => {
            const request = codeRequests[selectedCode.requestIndex]
            const fileName = generateDescriptiveName(
              selectedCode.content, 
              selectedCode.language, 
              request?.userMessage
            )
            downloadCode(selectedCode.content, selectedCode.language, fileName)
          }}
        />
      )}
    </>
  )
}

CodeSidebar.propTypes = {
  codeRequests: PropTypes.arrayOf(
    PropTypes.shape({
      codes: PropTypes.arrayOf(
        PropTypes.shape({
          content: PropTypes.string.isRequired,
          language: PropTypes.string
        })
      ).isRequired,
      userMessage: PropTypes.string
    })
  ).isRequired
}

export default CodeSidebar
