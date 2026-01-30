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

  const generateDescriptiveName = (code, language, userMessage = '', codeIndex = 0) => {
    // Intentar detectar nombres de archivos, clases o funciones en el código
    let detectedName = ''
    
    // Lista de nombres genéricos a evitar
    const genericNames = ['main', 'index', 'app', 'test', 'example', 'demo', 'temp', 'file', 'code', 'program', 'script']
    
    // 1. Buscar comentarios con nombres de archivo al inicio
    const fileCommentMatch = code.match(/^(?:\/\/|#|\/\*|\*)\s*(?:File|Archivo|Filename)?:?\s*([a-zA-Z0-9_-]+\.[a-z]+)/mi)
    if (fileCommentMatch) {
      const name = fileCommentMatch[1].split('.')[0]
      if (!genericNames.includes(name.toLowerCase())) {
        return name
      }
    }
    
    // 2. Para Java, buscar clase pública primero
    if (language === 'java') {
      const publicClassMatch = code.match(/public\s+class\s+([A-Z][a-zA-Z0-9_]*)/m)
      if (publicClassMatch && !genericNames.includes(publicClassMatch[1].toLowerCase())) {
        return publicClassMatch[1]
      }
      // Si no hay clase pública, buscar cualquier clase que no sea genérica
      const classMatches = code.match(/class\s+([A-Z][a-zA-Z0-9_]*)/gm)
      if (classMatches) {
        for (const match of classMatches) {
          const className = match.match(/class\s+([A-Z][a-zA-Z0-9_]*)/)[1]
          if (!genericNames.includes(className.toLowerCase())) {
            return className
          }
        }
      }
    }
    
    // 3. Para HTML, buscar el nombre en el título o en data-page
    if (language === 'html') {
      const titleMatch = code.match(/<title>(.*?)<\/title>/i)
      if (titleMatch && titleMatch[1].trim() && !titleMatch[1].toLowerCase().includes('title')) {
        const cleanTitle = titleMatch[1].trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
        if (!genericNames.includes(cleanTitle.toLowerCase())) {
          return cleanTitle
        }
      }
      const dataPageMatch = code.match(/data-page=["']([^"']+)["']/i)
      if (dataPageMatch && !genericNames.includes(dataPageMatch[1].toLowerCase())) {
        return dataPageMatch[1]
      }
      // Buscar id o clase significativa en el body o contenedor principal
      const mainIdMatch = code.match(/<(?:body|main|div)[^>]*\s+id=["']([a-zA-Z][a-zA-Z0-9_-]*)["']/i)
      if (mainIdMatch && !genericNames.includes(mainIdMatch[1].toLowerCase())) {
        return mainIdMatch[1]
      }
    }
    
    // 4. Para CSS, buscar el nombre en comentarios o clases principales
    if (language === 'css' || language === 'scss') {
      const cssCommentMatch = code.match(/\/\*\s*([a-zA-Z0-9_-]+)\.(?:css|scss)\s*\*\//i)
      if (cssCommentMatch && !genericNames.includes(cssCommentMatch[1].toLowerCase())) {
        return cssCommentMatch[1]
      }
      // Buscar clase o id más común (excluyendo genéricos como 'container', 'wrapper')
      const selectorMatches = code.match(/[.#]([a-zA-Z][a-zA-Z0-9_-]*)/g)
      if (selectorMatches && selectorMatches.length > 0) {
        const selectorNames = selectorMatches.map(s => s.slice(1))
        const frequency = {}
        selectorNames.forEach(name => {
          const lower = name.toLowerCase()
          if (!['container', 'wrapper', 'content', 'main', 'body'].includes(lower)) {
            frequency[name] = (frequency[name] || 0) + 1
          }
        })
        const mostCommon = Object.entries(frequency).sort((a, b) => b[1] - a[1])[0]
        if (mostCommon && mostCommon[1] > 1) {
          return mostCommon[0]
        }
      }
    }
    
    // 5. Buscar export default con nombre (React/JS/TS)
    if (['javascript', 'typescript', 'jsx', 'tsx'].includes(language)) {
      const exportMatch = code.match(/export\s+default\s+(?:function\s+)?([A-Z][a-zA-Z0-9_]*)/m)
      if (exportMatch && !genericNames.includes(exportMatch[1].toLowerCase())) {
        return exportMatch[1]
      }
    }
    
    // 6. Buscar nombre de clase principal 
    const firstLines = code.split('\n').slice(0, 30).join('\n')
    const classMatch = firstLines.match(/(?:public\s+)?(?:class|interface|struct|enum)\s+([A-Z][a-zA-Z0-9_]*)/m)
    if (classMatch && !genericNames.includes(classMatch[1].toLowerCase())) {
      return classMatch[1]
    }
    
    // 7. Buscar componente React en las primeras líneas
    if (language === 'jsx' || language === 'tsx') {
      const componentMatch = firstLines.match(/(?:function|const)\s+([A-Z][a-zA-Z0-9_]*)\s*[=\(]/m)
      if (componentMatch && !genericNames.includes(componentMatch[1].toLowerCase())) {
        return componentMatch[1]
      }
    }
    
    // 8. Para Python, buscar la clase o función principal
    if (language === 'python') {
      // Buscar clase primero
      const pythonClassMatches = code.match(/class\s+([A-Z][a-zA-Z0-9_]*)/gm)
      if (pythonClassMatches) {
        for (const match of pythonClassMatches) {
          const className = match.match(/class\s+([A-Z][a-zA-Z0-9_]*)/)[1]
          if (!genericNames.includes(className.toLowerCase())) {
            return className
          }
        }
      }
      // Buscar función principal (no __init__ ni __main__)
      const pythonDefMatches = code.match(/def\s+([a-z_][a-zA-Z0-9_]*)\s*\(/gm)
      if (pythonDefMatches) {
        for (const match of pythonDefMatches) {
          const funcName = match.match(/def\s+([a-z_][a-zA-Z0-9_]*)/)[1]
          if (!['__init__', '__main__', '__str__', '__repr__'].includes(funcName) 
              && !funcName.startsWith('_')
              && !genericNames.includes(funcName.toLowerCase())) {
            return funcName
          }
        }
      }
    }
    
    // 9. Para C/C++, buscar clases, structs o funciones principales
    if (language === 'cpp' || language === 'c') {
      // Buscar clase o struct
      const cppClassMatch = firstLines.match(/(?:class|struct)\s+([A-Z][a-zA-Z0-9_]*)/m)
      if (cppClassMatch && !genericNames.includes(cppClassMatch[1].toLowerCase())) {
        return cppClassMatch[1]
      }
      // Buscar función principal que no sea main
      const cppFuncMatch = code.match(/(?:int|void|double|float|char|bool|auto)\s+([a-z][a-zA-Z0-9_]*)\s*\([^)]*\)\s*\{/m)
      if (cppFuncMatch && cppFuncMatch[1] !== 'main' && !genericNames.includes(cppFuncMatch[1].toLowerCase())) {
        return cppFuncMatch[1]
      }
      // Buscar typedef o using para tipos personalizados
      const typedefMatch = code.match(/(?:typedef|using)\s+(?:struct\s+)?([A-Z][a-zA-Z0-9_]*)/m)
      if (typedefMatch && !genericNames.includes(typedefMatch[1].toLowerCase())) {
        return typedefMatch[1]
      }
    }
    
    // 10. Buscar nombres descriptivos en comentarios de descripción
    const descriptionMatch = code.match(/(?:\/\/|#|\/\*\*?)\s*(?:Description|Descripción|Purpose|Propósito):?\s*([A-Z][a-zA-Z0-9\s]+)/mi)
    if (descriptionMatch) {
      const description = descriptionMatch[1].trim().split(/\s+/).slice(0, 2).join('_')
      if (description && !genericNames.includes(description.toLowerCase())) {
        return description.replace(/[^a-zA-Z0-9_]/g, '')
      }
    }
    
    // 11. Analizar patrones específicos del código para inferir propósito
    const purposePatterns = {
      'Calculator': /(?:calculate|calculator|calc|suma|resta|multiply|divide|operacion)/i,
      'User': /(?:user|usuario|login|signup|register|authentication|persona)/i,
      'Database': /(?:database|db|connection|query|sql|modelo|tabla)/i,
      'Form': /(?:form|formulario|input|validation|submit)/i,
      'Button': /(?:button|btn|click|press|boton)/i,
      'Card': /(?:card|tarjeta|panel)/i,
      'List': /(?:list|lista|array|collection|elemento)/i,
      'Modal': /(?:modal|dialog|popup|overlay|ventana)/i,
      'Table': /(?:table|tabla|grid|datagrid)/i,
      'Chart': /(?:chart|graph|gráfico|plot)/i,
      'Service': /(?:service|api|request|fetch|axios|servicio)/i,
      'Utils': /(?:util|helper|tools|common|herramienta)/i,
      'Game': /(?:game|juego|play|player|score|punto)/i,
      'Student': /(?:student|estudiante|alumno|grade|nota|curso)/i,
      'Product': /(?:product|producto|price|precio|inventory)/i,
      'Employee': /(?:employee|empleado|worker|salary|salario)/i,
      'Vehicle': /(?:vehicle|vehiculo|car|coche|auto)/i,
      'Book': /(?:book|libro|author|autor|page|pagina)/i,
      'Animal': /(?:animal|pet|mascota|dog|cat|perro|gato)/i,
      'Rectangle': /(?:rectangle|rectangulo|width|height|ancho|alto|area)/i,
      'Circle': /(?:circle|circulo|radius|radio|circumference)/i,
      'Bank': /(?:bank|banco|account|cuenta|balance|saldo)/i,
      'Temperature': /(?:temperature|temperatura|celsius|fahrenheit)/i
    }
    
    for (const [name, pattern] of Object.entries(purposePatterns)) {
      if (pattern.test(code)) {
        return name
      }
    }
    
    // 12. Si no se encuentra nada específico, usar lenguaje + índice
    const langName = language || 'file'
    return `${langName}_${codeIndex + 1}`
  }

  const generateRequestTitle = (codes, userMessage) => {
    // Si solo hay un código, usar su nombre
    if (codes.length === 1) {
      const name = generateDescriptiveName(codes[0].content, codes[0].language, userMessage, 0)
      return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
    
    // Para múltiples códigos, obtener nombres de todos
    const codeNames = codes.map((code, index) => 
      generateDescriptiveName(code.content, code.language, userMessage, index)
    )

    const uniqueNames = [...new Set(codeNames)]
    
    // Si todos tienen nombres únicos mostrarlos
    const hasGenericNames = codeNames.some(name => name.match(/^(code|file|javascript|python|html|css)_\d+$/i))
    
    if (uniqueNames.length === codes.length && !hasGenericNames && codes.length <= 3) {
      const displayNames = codeNames
        .map(name => name.charAt(0).toUpperCase() + name.slice(1))
        .join(', ')
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

  const downloadAllCodes = async (requestIndex, codes, userMessage, sectionTitle) => {
    // Si solo hay un código, descargar directamente sin ZIP
    if (codes.length === 1) {
      const baseName = generateDescriptiveName(codes[0].content, codes[0].language, userMessage, 0)
      downloadCode(codes[0].content, codes[0].language, baseName)
      return
    }

    // Si hay múltiples códigos, crear un ZIP
    const zip = new JSZip()
    const usedFileNames = new Set()
    
    codes.forEach((code, index) => {
      const individualName = generateDescriptiveName(code.content, code.language, userMessage, index)
      const extension = getFileExtension(code.language)
      let fileName = `${individualName}.${extension}`
      
      // Si el nombre ya existe, añadir un sufijo numérico
      let counter = 1
      let uniqueFileName = fileName
      while (usedFileNames.has(uniqueFileName)) {
        const baseName = individualName.replace(/_\d+$/, '') // Remover sufijo numérico si existe
        uniqueFileName = `${baseName}_${counter}.${extension}`
        counter++
      }
      usedFileNames.add(uniqueFileName)
      
      zip.file(uniqueFileName, code.content)
    })

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // Nombre del ZIP título de la sección
    // Eliminar el contador de archivos
    const cleanTitle = sectionTitle.replace(/\s*\(\d+\s+archivos?\)$/i, '').trim()
    const zipName = cleanTitle.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_áéíóúñ]/gi, '')
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
          {codeRequests.map((request, requestIndex) => {
            const sectionTitle = generateRequestTitle(request.codes, request.userMessage)
            
            return (
              <div key={requestIndex} className="code-request-section">
                <div className="request-header">
                  <h3 className="request-title">
                    {sectionTitle}
                  </h3>
                  <button
                    className="download-all-button"
                    onClick={() => downloadAllCodes(requestIndex, request.codes, request.userMessage, sectionTitle)}
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
            )
          })}
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
