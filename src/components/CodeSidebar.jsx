import { useState } from 'react'
import PropTypes from 'prop-types'
import { IoIosArrowBack } from 'react-icons/io'
import { MdDownload } from 'react-icons/md'
import JSZip from 'jszip'
import '../css/CodeSidebar.css'

function CodeSidebar({ codeRequests }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
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

  const downloadAllCodes = async (requestIndex, codes) => {
    // Si solo hay un código, descargar directamente sin ZIP
    if (codes.length === 1) {
      const code = codes[0]
      downloadCode(code.content, code.language, `codigo_peticion_${requestIndex + 1}`)
      return
    }

    // Si hay múltiples códigos, crear un ZIP
    const zip = new JSZip()
    
    codes.forEach((code, index) => {
      const extension = getFileExtension(code.language)
      const fileName = `codigo_${index + 1}.${extension}`
      zip.file(fileName, code.content)
    })

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `codigos_peticion_${requestIndex + 1}.zip`
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
                  Códigos Petición {requestIndex + 1}
                </h3>
                <button
                  className="download-all-button"
                  onClick={() => downloadAllCodes(requestIndex, request.codes)}
                  title={request.codes.length === 1 ? 'Descargar código' : 'Descargar todos los códigos'}
                >
                  <MdDownload />
                </button>
              </div>

              <div className="codes-list">
                {request.codes.map((code, codeIndex) => (
                  <div key={codeIndex} className="code-item">
                    <div className="code-item-header">
                      <span className="code-language">{code.language || 'text'}</span>
                      <button
                        className="download-code-button"
                        onClick={() => downloadCode(
                          code.content,
                          code.language,
                          `codigo_peticion_${requestIndex + 1}_${codeIndex + 1}`
                        )}
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
      ).isRequired
    })
  ).isRequired
}

export default CodeSidebar
