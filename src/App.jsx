import { useState, useEffect, useRef } from 'react'
import './css/App.css'
import ChatMessage from './components/ChatMessage'
import ChatInput from './components/ChatInput'
import ThemeToggle from './components/ThemeToggle'

function App() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState('Auto')
  const [images, setImages] = useState([])
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    // Detectar preferencia del sistema
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const messagesEndRef = useRef(null)
  const autoScrollEnabled = useRef(true)
  const messagesContainerRef = useRef(null)
  const isAutoScrolling = useRef(false)

  // Aplicar tema
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light')
  }, [isDarkTheme])

  // Detectar scroll manual del usuario
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    let scrollTimeout = null
    let lastScrollTop = container.scrollTop

    const handleScroll = () => {
      // Ignorar eventos de scroll si estamos haciendo autoscroll
      if (isAutoScrolling.current) {
        lastScrollTop = container.scrollTop
        return
      }

      const currentScrollTop = container.scrollTop
      
      // Solo procesar si hay un cambio real de posición (scroll manual)
      if (currentScrollTop === lastScrollTop) {
        return
      }
      
      lastScrollTop = currentScrollTop

      // Limpiar timeout anterior
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }

      // Esperar un poco para asegurarnos de que el usuario terminó de scrollear
      scrollTimeout = setTimeout(() => {
        const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 10
        
        // Si NO estamos al final, desactivar autoscroll
        if (!isAtBottom) {
          autoScrollEnabled.current = false
        } else {
          // Si volvemos al final manualmente, reactivar autoscroll
          autoScrollEnabled.current = true
        }
      }, 50)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollTimeout) clearTimeout(scrollTimeout)
    }
  }, [])

  // Auto-scroll cuando está habilitado y hay cambios en los mensajes
  useEffect(() => {
    if (autoScrollEnabled.current && messagesEndRef.current) {
      isAutoScrolling.current = true
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      
      // Resetear la bandera después de que termine el scroll
      setTimeout(() => {
        isAutoScrolling.current = false
      }, 1000)
    }
  }, [messages])

  const handleSendMessage = async (userMessage) => {
    // Activar auto-scroll cuando el usuario envía un mensaje
    autoScrollEnabled.current = true
    
    // Agregar mensaje del usuario con imágenes si las hay
    const newUserMessage = { 
      text: userMessage, 
      isUser: true,
      images: [...images] // Copiar las imágenes actuales
    }
    setMessages(prev => [...prev, newUserMessage])
    
    // Agregar mensaje vacío de la IA que se irá llenando
    const aiMessageIndex = messages.length + 1
    setMessages(prev => [...prev, { text: '', isUser: false, isLoading: true }])
    setIsLoading(true)

    try {
      // Determinar el modelo a usar
      const modelToUse = selectedModel === 'Auto' ? 'qwen2.5-coder:14b' : selectedModel
      
      // Construir historial de mensajes para contexto (incluyendo el mensaje actual)
      const messageHistory = [...messages, newUserMessage].map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text
      }))
      
      // Crear FormData para enviar al backend
      const formData = new FormData()
      formData.append('model', modelToUse)
      formData.append('prompt', userMessage)
      formData.append('messages', JSON.stringify(messageHistory))
      
      // Añadir imágenes si existen
      if (images.length > 0) {
        images.forEach((img) => {
          formData.append('images', img.file)
        })
      }

      // Llamar al backend con streaming
      const response = await fetch('http://localhost:3000/api/generate/stream', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor')
      }

      // Leer el stream
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              break
            }
            if (data.startsWith('[ERROR]')) {
              throw new Error(data.slice(8))
            }
            // Decodificar JSON para preservar saltos de línea y caracteres especiales
            try {
              const decodedChunk = JSON.parse(data)
              accumulatedText += decodedChunk
            } catch (e) {
              // Si no es JSON válido, usar el texto tal cual
              accumulatedText += data
            }
            // Actualizar el mensaje de la IA en tiempo real
            setMessages(prev => {
              const newMessages = [...prev]
              newMessages[aiMessageIndex] = { text: accumulatedText, isUser: false, isLoading: false }
              return newMessages
            })
          }
        }
      }
      
      // Limpiar imágenes después de enviar
      setImages([])
    } catch (error) {
      console.error('Error al enviar mensaje:', error)
      // Actualizar el mensaje de la IA con el error
      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[aiMessageIndex] = {
          text: 'Error al comunicarse con la IA. Verifica que el backend esté corriendo.',
          isUser: false,
          isError: true
        }
        return newMessages
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTheme = () => {
    setIsDarkTheme(prev => !prev)
  }

  return (
    <div className="app-container">
      <ThemeToggle isDark={isDarkTheme} onToggle={toggleTheme} />

      <div className="messages-container" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>¿En qué puedo ayudarte hoy?</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <ChatMessage 
              key={index} 
              message={msg.text} 
              isUser={msg.isUser}
              isError={msg.isError}
              images={msg.images || []}
              isFirstMessage={index === 0}
              isLoading={msg.isLoading || false}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput 
        onSendMessage={handleSendMessage} 
        isLoading={isLoading}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        images={images}
        onImagesChange={setImages}
      />
    </div>
  )
}

export default App
