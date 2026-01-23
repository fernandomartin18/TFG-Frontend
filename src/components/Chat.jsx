import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import '../css/App.css'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import ThemeToggle from './ThemeToggle'
import CodeSidebar from './CodeSidebar'
import LeftSidebar from './LeftSidebar'
import { fetchWithAuth } from '../services/api.service'

function Chat({ isAuthenticated }) {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState('')
  const [images, setImages] = useState([])
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    // Detectar preferencia del sistema
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [codeRequests, setCodeRequests] = useState([])
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true)
  const messagesEndRef = useRef(null)
  const autoScrollEnabled = useRef(true)
  const messagesContainerRef = useRef(null)
  const isAutoScrolling = useRef(false)

  // Aplicar tema
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light')
  }, [isDarkTheme])

  // Extraer bloques de código de los mensajes de la IA
  useEffect(() => {
    const extractCodeBlocks = () => {
      const requests = []
      let currentRequestCodes = []
      let currentUserMessage = ''
      let isCollectingCodes = false

      messages.forEach((msg) => {
        // Detectar inicio de una nueva petición (mensaje del usuario)
        if (msg.isUser) {
          // Si había códigos de la petición anterior, guardarlos
          if (currentRequestCodes.length > 0) {
            requests.push({ 
              codes: currentRequestCodes,
              userMessage: currentUserMessage
            })
            currentRequestCodes = []
          }
          isCollectingCodes = true
          currentUserMessage = msg.text
        } 
        // Extraer códigos de respuestas de la IA
        else if (isCollectingCodes && !msg.isUser && !msg.isError) {
          const codeBlockPattern = /```(\w+)?\n([\s\S]*?)```/g
          let match
          
          while ((match = codeBlockPattern.exec(msg.text)) !== null) {
            const language = match[1] || 'text'
            const content = match[2].trim()
            
            if (content) {
              currentRequestCodes.push({
                content,
                language
              })
            }
          }
        }
      })

      // Guardar los códigos de la última petición si existen
      if (currentRequestCodes.length > 0) {
        requests.push({ 
          codes: currentRequestCodes,
          userMessage: currentUserMessage
        })
      }

      setCodeRequests(requests)
    }

    extractCodeBlocks()
  }, [messages])

  // Detectar scroll manual del usuario
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    let scrollTimeout = null
    let lastScrollTop = container.scrollTop

    const handleScroll = () => {
      if (isAutoScrolling.current) {
        lastScrollTop = container.scrollTop
        return
      }

      const currentScrollTop = container.scrollTop
      
      if (currentScrollTop === lastScrollTop) {
        return
      }
      
      lastScrollTop = currentScrollTop

      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }

      scrollTimeout = setTimeout(() => {
        const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 10
        
        if (!isAtBottom) {
          autoScrollEnabled.current = false
        } else {
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
      
      setTimeout(() => {
        isAutoScrolling.current = false
      }, 1000)
    }
  }, [messages])

  const handleSendMessage = async (userMessage) => {
    autoScrollEnabled.current = true
    
    const isVisionModel = () => {
      if (!selectedModel || selectedModel === 'No hay LLMs') return false
      if (selectedModel === 'Auto') return true
      
      const modelLower = selectedModel.toLowerCase()
      const visionKeywords = ['vl', 'vision', 'llava', 'bakllava', 'moondream']
      return visionKeywords.some(keyword => modelLower.includes(keyword))
    }
    
    const imagesToSend = isVisionModel() ? [...images] : []
    
    const newUserMessage = { 
      text: userMessage, 
      isUser: true,
      images: imagesToSend
    }
    setMessages(prev => [...prev, newUserMessage])
    
    setImages([])
    
    const aiMessageIndex = messages.length + 1
    setMessages(prev => [...prev, { text: '', isUser: false, isLoading: true }])
    setIsLoading(true)

    try {
      const modelToUse = selectedModel === 'Auto' ? 'qwen2.5-coder:14b' : selectedModel
      const isAutoMode = selectedModel === 'Auto'
      
      const messageHistory = [...messages, newUserMessage].map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text
      }))
      
      const formData = new FormData()
      formData.append('model', modelToUse)
      formData.append('prompt', userMessage)
      formData.append('messages', JSON.stringify(messageHistory))
      formData.append('autoMode', isAutoMode ? 'true' : 'false')
      
      if (imagesToSend.length > 0) {
        imagesToSend.forEach((img) => {
          formData.append('images', img.file)
        })
      }

      const response = await fetchWithAuth('http://localhost:3000/api/generate/stream', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''
      let step1Text = ''
      let step2Text = ''
      let currentStep = 0

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
            
            try {
              const decodedChunk = JSON.parse(data)
              
              if (decodedChunk === '[STEP1_START]') {
                currentStep = 1
                continue
              }
              
              if (decodedChunk === '[STEP1_END]') {
                step1Text = accumulatedText
                accumulatedText = ''
                continue
              }
              
              if (decodedChunk === '[STEP2_START]') {
                currentStep = 2
                continue
              }
              
              if (currentStep === 1) {
                accumulatedText += decodedChunk
                setMessages(prev => {
                  const newMessages = [...prev]
                  newMessages[aiMessageIndex] = { 
                    text: accumulatedText, 
                    isUser: false, 
                    isLoading: false,
                    isTwoStep: true,
                    step1Text: accumulatedText,
                    step2Text: '',
                    currentStep: 1
                  }
                  return newMessages
                })
              } else if (currentStep === 2) {
                accumulatedText += decodedChunk
                setMessages(prev => {
                  const newMessages = [...prev]
                  newMessages[aiMessageIndex] = { 
                    text: accumulatedText, 
                    isUser: false, 
                    isLoading: false,
                    isTwoStep: true,
                    step1Text: step1Text,
                    step2Text: accumulatedText,
                    currentStep: 2
                  }
                  return newMessages
                })
              } else {
                accumulatedText += decodedChunk
                setMessages(prev => {
                  const newMessages = [...prev]
                  newMessages[aiMessageIndex] = { text: accumulatedText, isUser: false, isLoading: false }
                  return newMessages
                })
              }
            } catch (e) {
              accumulatedText += data
              setMessages(prev => {
                const newMessages = [...prev]
                newMessages[aiMessageIndex] = { text: accumulatedText, isUser: false, isLoading: false }
                return newMessages
              })
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Error al enviar mensaje:', error)
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
    <div className={`app-container ${isLeftSidebarOpen ? 'left-sidebar-open' : ''}`}>
      <ThemeToggle isDark={isDarkTheme} onToggle={toggleTheme} />
      
      <LeftSidebar 
        isOpen={isLeftSidebarOpen} 
        setIsOpen={setIsLeftSidebarOpen}
        isAuthenticated={isAuthenticated}
      />
      
      <CodeSidebar codeRequests={codeRequests} />

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
              isTwoStep={msg.isTwoStep || false}
              step1Text={msg.step1Text || ''}
              step2Text={msg.step2Text || ''}
              currentStep={msg.currentStep || 0}
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

Chat.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired
}

export default Chat
