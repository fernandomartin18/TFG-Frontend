import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { FaCopy } from 'react-icons/fa6'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ImageModal from './ImageModal'
import ImageDropdown from './ImageDropdown'
import '../css/ChatMessage.css'

function ChatMessage({ message, isUser, isError = false, images = [] }) {
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
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

  const handleCopy = async (code, index) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('Error al copiar:', err)
    }
  }

  const handlePreviewClick = () => {
    if (images.length === 1) {
      setSelectedImageIndex(0)
      setShowModal(true)
    } else if (images.length > 1) {
      setShowDropdown(!showDropdown)
    }
  }

  const handleImageClick = (index) => {
    setSelectedImageIndex(index)
    setShowModal(true)
    setShowDropdown(false)
  }

  const handleDeleteImage = () => {
    // En el chat no permitimos eliminar imágenes
    // Solo cerrar el modal
    setShowModal(false)
    setSelectedImageIndex(null)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedImageIndex(null)
  }

  // Si es usuario, mostrar como burbuja normal
  if (isUser) {
    return (
      <div className="message-wrapper user-message">
        {images.length > 0 && (
          <div className="message-images">
            <div className="image-preview-container">
              <button
                type="button"
                className="image-preview-button"
                onClick={handlePreviewClick}
              >
                <img src={images[0].url} alt="Preview" className="image-preview" />
                {images.length > 1 && (
                  <div className="image-count-badge">+{images.length - 1}</div>
                )}
              </button>

              {showDropdown && images.length > 1 && (
                <ImageDropdown
                  images={images}
                  onImageClick={handleImageClick}
                  onDeleteImage={() => {}} // No permitir eliminar desde el chat
                  onClose={() => setShowDropdown(false)}
                  showDeleteButton={false}
                />
              )}
            </div>
          </div>
        )}
        <div className="message-content">
          <div className="message-text">{message}</div>
        </div>
        
        {showModal && selectedImageIndex !== null && (
          <ImageModal
            image={images[selectedImageIndex]}
            onClose={handleCloseModal}
            onDelete={handleDeleteImage}
            showDeleteButton={false}
          />
        )}
      </div>
    )
  }

  // Si es IA, parsear y mostrar con formato especial
  const parseMessage = (text) => {
    const parts = []
    let currentIndex = 0
    
    // Buscar bloques de código (completos o incompletos)
    const codeBlockPattern = /```(\w+)?\n/g
    let match
    
    while ((match = codeBlockPattern.exec(text)) !== null) {
      const openIndex = match.index
      const language = match[1] || 'text'
      const contentStart = match.index + match[0].length
      
      // Agregar texto antes del bloque de código
      if (openIndex > currentIndex) {
        parts.push({
          type: 'text',
          content: text.substring(currentIndex, openIndex)
        })
      }
      
      // Buscar cierre del bloque (```)
      const closeMatch = text.indexOf('```', contentStart)
      
      if (closeMatch !== -1) {
        // Bloque completo
        parts.push({
          type: 'code',
          language: language,
          content: text.substring(contentStart, closeMatch).trim(),
          complete: true
        })
        currentIndex = closeMatch + 3
        codeBlockPattern.lastIndex = currentIndex
      } else {
        // Bloque incompleto (streaming)
        parts.push({
          type: 'code',
          language: language,
          content: text.substring(contentStart),
          complete: false
        })
        currentIndex = text.length
        break
      }
    }
    
    // Agregar texto restante
    if (currentIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(currentIndex)
      })
    }

    return parts.length > 0 ? parts : [{ type: 'text', content: text }]
  }

  const messageParts = parseMessage(message)

  return (
    <div className="message-wrapper ai-message">
      <div className={`ai-content ${isError ? 'error-message' : ''}`}>
        {messageParts.map((part, index) => {
          if (part.type === 'code') {
            return (
              <div key={index} className="code-block">
                <div className="code-header">
                  <span className="code-language">{part.language}</span>
                  {part.complete && (
                    <div className="copy-button-container">
                      <button 
                        className="copy-button"
                        onClick={() => handleCopy(part.content, index)}
                        title={copiedIndex === index ? "¡Copiado!" : "Copiar código"}
                      >
                        <FaCopy size={16} />
                      </button>
                      {copiedIndex === index && (
                        <span className="copy-tooltip">¡Copiado!</span>
                      )}
                    </div>
                  )}
                </div>
                <SyntaxHighlighter
                  language={part.language || 'text'}
                  style={codeStyle}
                  customStyle={{
                    margin: 0,
                    borderRadius: '0 0 0.5rem 0.5rem',
                    fontSize: '1rem',
                    padding: '1rem',
                    backgroundColor: isDarkMode ? '#1e1e1e' : '#f5f5f5',
                  }}
                  codeTagProps={{
                    style: {
                      fontFamily: "'Fira Code', 'Courier New', monospace",
                      lineHeight: '1.5',
                      fontSize: '1.1rem'
                    }
                  }}
                  showLineNumbers={false}
                  wrapLines={true}
                >
                  {part.content}{!part.complete && '▊'}
                </SyntaxHighlighter>
              </div>
            )
          } else {
            return (
              <div key={index} className="ai-text markdown-content">
                <ReactMarkdown>{part.content}</ReactMarkdown>
              </div>
            )
          }
        })}
      </div>
    </div>
  )
}

ChatMessage.propTypes = {
  message: PropTypes.string.isRequired,
  isUser: PropTypes.bool.isRequired,
  isError: PropTypes.bool,
  images: PropTypes.array
}

export default ChatMessage
