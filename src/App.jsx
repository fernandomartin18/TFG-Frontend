import { useState, useEffect, useRef } from 'react'
import './css/App.css'
import ChatMessage from './components/ChatMessage'
import ChatInput from './components/ChatInput'
import ThemeToggle from './components/ThemeToggle'

function App() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const messagesEndRef = useRef(null)

  // Aplicar tema
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light')
  }, [isDarkTheme])

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (userMessage) => {
    // Agregar mensaje del usuario
    const newUserMessage = { text: userMessage, isUser: true }
    setMessages(prev => [...prev, newUserMessage])
    setIsLoading(true)

    try {
      // Crear FormData para enviar al backend
      const formData = new FormData()
      formData.append('model', 'qwen2.5-coder:14b')
      formData.append('prompt', userMessage)

      // Llamar al backend
      const response = await fetch('http://localhost:3000/api/generate', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor')
      }

      const data = await response.json()
      
      // Agregar respuesta de la IA
      const aiMessage = { 
        text: data.result || data.response || data.message || 'Sin respuesta', 
        isUser: false 
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error al enviar mensaje:', error)
      const errorMessage = { 
        text: 'Error al comunicarse con la IA. Verifica que el backend esté corriendo.', 
        isUser: false 
      }
      setMessages(prev => [...prev, errorMessage])
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

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>Escribe un mensaje para comenzar la conversación</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <ChatMessage 
              key={index} 
              message={msg.text} 
              isUser={msg.isUser} 
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  )
}

export default App
