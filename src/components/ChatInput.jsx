import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { IoSend } from 'react-icons/io5'
import ModelSelector from './ModelSelector'
import ImageUploader from './ImageUploader'
import '../css/ChatInput.css'

function ChatInput({ onSendMessage, isLoading, selectedModel, onModelChange, images, onImagesChange }) {
  const [input, setInput] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      // Altura del textarea basada en scrollHeight, con un máximo de 8 líneas
      const lineHeight = 24 // 1.5em * 16px
      const maxHeight = lineHeight * 8 + 24 // 8 lines + padding
      const newHeight = Math.min(textarea.scrollHeight, maxHeight)
      textarea.style.height = `${newHeight}px`
      
      // Habilitar scroll solo cuando el contenido excede la altura máxima
      if (textarea.scrollHeight > maxHeight) {
        textarea.style.overflowY = 'scroll'
      } else {
        textarea.style.overflowY = 'hidden'
      }
    }
  }, [input])

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input)
      setInput('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-input-container">
      <div className="chat-input-form">
        <div className="image-uploader-group">
          <ImageUploader 
            images={images}
            onImagesChange={onImagesChange}
            selectedModel={selectedModel}
          />
        </div>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu mensaje..."
          className="chat-input"
          rows={1}
        />
        <div className="controls-group">
          <ModelSelector 
            selectedModel={selectedModel}
            onModelChange={onModelChange}
          />
          <button 
            type="button" 
            onClick={handleSend}
            className="send-button"
            disabled={!input.trim() || isLoading}
          >
            <IoSend size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

ChatInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  selectedModel: PropTypes.string.isRequired,
  onModelChange: PropTypes.func.isRequired,
  images: PropTypes.array.isRequired,
  onImagesChange: PropTypes.func.isRequired
}

export default ChatInput
