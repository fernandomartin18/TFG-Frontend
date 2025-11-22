import { useState } from 'react'
import PropTypes from 'prop-types'
import { FaCopy } from 'react-icons/fa6'
import ReactMarkdown from 'react-markdown'
import ImageModal from './ImageModal'
import ImageDropdown from './ImageDropdown'
import '../css/ChatMessage.css'

function ChatMessage({ message, isUser, isError = false, images = [] }) {
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)

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
    const regex = /```(\w+)?\n([\s\S]*?)```/g
    let lastIndex = 0
    let match

    while ((match = regex.exec(text)) !== null) {
      // Agregar texto antes del bloque de código
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        })
      }

      // Agregar bloque de código
      parts.push({
        type: 'code',
        language: match[1] || 'text',
        content: match[2].trim()
      })

      lastIndex = regex.lastIndex
    }

    // Agregar texto restante
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex)
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
                  <button 
                    className="copy-button"
                    onClick={() => handleCopy(part.content, index)}
                    title={copiedIndex === index ? "¡Copiado!" : "Copiar código"}
                  >
                    <FaCopy size={16} />
                  </button>
                </div>
                <pre className="code-content">
                  <code>{part.content}</code>
                </pre>
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
