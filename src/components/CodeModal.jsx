import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { MdDownload, MdClose } from 'react-icons/md'
import { FaCopy } from 'react-icons/fa6'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import '../css/CodeModal.css'

function CodeModal({ code, language, onClose, onDownload }) {
  const [copied, setCopied] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  )

  // Detectar cambios en el tema
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark')
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })

    return () => observer.disconnect()
  }, [])

  const codeStyle = isDarkMode ? vscDarkPlus : vs

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error al copiar:', err)
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div className="code-modal-backdrop" onClick={handleBackdropClick}>
      <div className="code-modal-container">
        <div className="code-modal-header">
          <div className="code-modal-info">
          </div>
          <div className="code-modal-actions">
            <button
              className="code-modal-button download"
              onClick={onDownload}
              title="Descargar código"
            >
              <MdDownload />
            </button>
            <button
              className="code-modal-button close"
              onClick={onClose}
              title="Cerrar"
            >
              <MdClose />
            </button>
          </div>
        </div>

        <div className="code-modal-body">
          <div className="code-block">
            <div className="code-block-header">
              <span className="code-language-tag">{language || 'text'}</span>
              <button
                className={`copy-button ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
                title={copied ? 'Copiado!' : 'Copiar código'}
              >
                {copied ? (
                  <>
                    <FaCopy /> Copiado!
                  </>
                ) : (
                  <>
                    <FaCopy /> Copiar
                  </>
                )}
              </button>
            </div>
            <div className="code-block-content">
              <SyntaxHighlighter
                language={language || 'text'}
                style={codeStyle}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  borderRadius: '0 0 8px 8px',
                  fontSize: '1.1rem',
                  maxHeight: 'none',
                  height: '100%',
                }}
                showLineNumbers
                wrapLines
              >
                {code}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

CodeModal.propTypes = {
  code: PropTypes.string.isRequired,
  language: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onDownload: PropTypes.func.isRequired
}

export default CodeModal
