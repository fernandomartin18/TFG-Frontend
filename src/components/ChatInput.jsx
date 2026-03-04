import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { IoSend } from 'react-icons/io5'
import { HiOutlineLightBulb, HiX } from 'react-icons/hi'
import ModelSelector from './ModelSelector'
import ImageUploader from './ImageUploader'
import '../css/ChatInput.css'

const PROMPT_TEMPLATES = [
  {
    title: "Código Híbrido desde Imagen",
    prompt: "Analiza el diagrama de clases de la imagen adjunta y genera los códigos en Python y Qiskit necesarios para implementarlo. Ten en cuenta que es un sistema híbrido que contiene tanto clases clásicas como componentes cuánticos. Por favor, sé riguroso y profesional, aplicando buenas prácticas de ingeniería de software y tipado."
  },
  {
    title: "Código Clásico desde Imagen",
    prompt: "Analiza el diagrama de clases de la imagen adjunta y extrae la estructura mostrada para generar los códigos necesarios en [INDICAR LENGUAJE]. Implementa correctamente las clases, métodos, y las relaciones orientadas a objetos (herencia, composición, etc.) que se aprecien visualmente."
  },
  {
    title: "Código Cuántico (Qiskit)",
    prompt: "Diseña un circuito cuántico utilizando Qiskit en Python para resolver:\n\n[DESCRIBE EL PROBLEMA O ALGORITMO QUANTUM AQUÍ]\n\nPor favor, incluye comentarios explicando cada compuerta (gates), el proceso de medición, y cómo ejecutarlo usando un simulador de Aer."
  },
  {
    title: "Código a partir de PlantUML",
    prompt: "A partir del siguiente diseño en formato PlantUML, genera los códigos equivalentes en [INDICAR LENGUAJE]. Asegúrate de incluir la definición completa de las clases, atributos, métodos y la correcta implementación de las relaciones orientadas a objetos (herencia, composición, agregación, etc.):\n\n[PEGA TU PLANTUML AQUÍ]"
  },
  {
    title: "Optimización de Código",
    prompt: "Analiza el siguiente código y sugiere optimizaciones de rendimiento y mejoras siguiendo principios SOLID y de buenas prácticas de código limpio:\n\n[PEGA TU CÓDIGO AQUÍ]"
  }
];

function ChatInput({ onSendMessage, isLoading, selectedModel, onModelChange, images, onImagesChange, initialInput = '', onInputClear = () => {} }) {
  const [input, setInput] = useState(initialInput)
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false)
  const textareaRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsTemplateMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  useEffect(() => {
    if (initialInput) {
      setInput(initialInput)
    }
  }, [initialInput])

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
      if (onInputClear) onInputClear()
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
        <div className="textarea-wrapper" ref={menuRef}>
          {isTemplateMenuOpen && (
            <div className="prompt-templates-dropdown">
              <div className="prompt-templates-header">
                <span>Plantillas de Prompt</span>
                <button type="button" onClick={() => setIsTemplateMenuOpen(false)}>
                  <HiX />
                </button>
              </div>
              <div className="prompt-templates-list">
                {PROMPT_TEMPLATES.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="prompt-template-item"
                    onClick={() => {
                      setInput(t.prompt)
                      setIsTemplateMenuOpen(false)
                      // Focus using slight delay
                      setTimeout(() => textareaRef.current?.focus(), 10)
                    }}
                  >
                    <strong>{t.title}</strong>
                    <div style={{fontSize: '0.8rem', opacity: 0.7, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                      {t.prompt}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje..."
            className="chat-input"
            rows={1}
          />
          <button 
            type="button" 
            className="template-btn" 
            onClick={() => setIsTemplateMenuOpen(prev => !prev)}
            title="Ver plantillas"
          >
            <HiOutlineLightBulb size={22} />
          </button>
        </div>
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
  onImagesChange: PropTypes.func.isRequired,
  initialInput: PropTypes.string,
  onInputClear: PropTypes.func
}

export default ChatInput
