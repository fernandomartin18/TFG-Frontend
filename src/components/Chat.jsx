import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import '../css/App.css'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import CodeSidebar from './CodeSidebar'
import LeftSidebar from './LeftSidebar'
import { fetchWithAuth } from '../services/api.service'
import chatService from '../services/chat.service'

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
  const [currentChatId, setCurrentChatId] = useState(null)
  const messagesEndRef = useRef(null)
  const autoScrollEnabled = useRef(true)
  const messagesContainerRef = useRef(null)
  const isAutoScrolling = useRef(false)
  const leftSidebarRef = useRef(null)
  const hasProcessedPendingMessages = useRef(false)

  // Aplicar tema
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light')
  }, [isDarkTheme])

  // Limpiar chat cuando el usuario cierra sesión
  useEffect(() => {
    if (!isAuthenticated) {
      // Si el usuario cierra sesión, limpiar el chat
      if (currentChatId !== null || messages.length > 0) {
        setMessages([])
        setCurrentChatId(null)
        setImages([])
      }
      // Resetear la bandera de mensajes procesados
      hasProcessedPendingMessages.current = false
    }
  }, [isAuthenticated])

  // Guardar mensajes en localStorage cuando hay mensajes y el usuario no está autenticado
  useEffect(() => {
    if (!isAuthenticated && messages.length > 0) {
      localStorage.setItem('pendingMessages', JSON.stringify(messages))
    }
  }, [messages, isAuthenticated])

  // Recuperar y guardar mensajes cuando el usuario inicia sesión
  useEffect(() => {
    const saveMessagesAfterAuth = async () => {
      // Verificar que no hayan sido procesados los mensajes pendientes
      if (isAuthenticated && !hasProcessedPendingMessages.current) {
        const pendingMessagesStr = localStorage.getItem('pendingMessages')
        
        if (pendingMessagesStr) {
          try {
            const pendingMessages = JSON.parse(pendingMessagesStr)
            
            // Solo procesar si hay mensajes válidos
            if (pendingMessages.length > 0) {
              // Marcar como procesado inmediatamente para evitar ejecuciones duplicadas
              hasProcessedPendingMessages.current = true
              
              // Crear un nuevo chat para guardar los mensajes existentes
              const firstUserMessage = pendingMessages.find(msg => msg.isUser)?.text || 'Chat sin título'
              const wordCount = firstUserMessage.trim().split(/\s+/).length
              const chatTitle = wordCount <= 4 ? firstUserMessage.trim() : 'Nuevo Chat'
              
              const newChat = await chatService.createChat(chatTitle)
              const chatId = newChat.id
              
              // Guardar todos los mensajes en orden
              for (const msg of pendingMessages) {
                if (!msg.isError && !msg.isLoading) {
                  const role = msg.isUser ? 'user' : 'assistant'
                  await chatService.createMessage(
                    chatId, 
                    role, 
                    msg.text, 
                    msg.isError || false, 
                    msg.isTwoStep || false
                  )
                }
              }
              
              // Si el título es genérico y hay más de un mensaje, generar uno automático
              if (chatTitle === 'Nuevo Chat' && pendingMessages.length > 1) {
                try {
                  const titleResponse = await fetchWithAuth('http://localhost:3000/api/generate/title', {
                    method: 'POST',
                    body: JSON.stringify({ 
                      conversation: pendingMessages.slice(0, 6).map(msg => ({
                        role: msg.isUser ? 'user' : 'assistant',
                        content: msg.text
                      }))
                    })
                  })
                  
                  if (titleResponse.ok) {
                    const data = await titleResponse.json()
                    await chatService.updateChatTitle(chatId, data.title)
                  }
                } catch (error) {
                  console.error('Error al generar título:', error)
                }
              }
              
              // Cargar los mensajes del chat recién creado
              setMessages(pendingMessages)
              setCurrentChatId(chatId)
              
              // Actualizar la lista de chats en el sidebar
              setTimeout(() => {
                if (leftSidebarRef.current && leftSidebarRef.current.refreshChats) {
                  leftSidebarRef.current.refreshChats()
                }
              }, 100)
              
              console.log('Mensajes guardados exitosamente al iniciar sesión')
            } else {
              // Si no hay mensajes, solo marcar como procesado y mantener el chat vacío
              hasProcessedPendingMessages.current = true
              setMessages([])
              setCurrentChatId(null)
              setImages([])
            }
            
            // Limpiar los mensajes pendientes INMEDIATAMENTE
            localStorage.removeItem('pendingMessages')
          } catch (error) {
            console.error('Error al guardar mensajes existentes:', error)
            localStorage.removeItem('pendingMessages')
            hasProcessedPendingMessages.current = false // Resetear en caso de error
          }
        } else {
          // Si no hay mensajes pendientes, marcar como procesado y mantener el chat vacío
          hasProcessedPendingMessages.current = true
          setMessages([])
          setCurrentChatId(null)
          setImages([])
        }
      }
    }

    saveMessagesAfterAuth()
  }, [isAuthenticated])

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
            currentRequestCodes = [] // Resetear para la nueva petición
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

  // Función para cargar un chat existente
  const handleChatSelect = async (chatId) => {
    // No permitir cambiar de chat si la IA está respondiendo
    if (isLoading) {
      return
    }
    
    try {
      setIsLoading(true)
      const chat = await chatService.getChatById(chatId)
      
      // Convertir los mensajes de la base de datos al formato del componente
      const loadedMessages = chat.messages.map(msg => {
        // Transformar las imágenes de la BD al formato esperado por el componente
        const formattedImages = (msg.images || []).map(img => ({
          url: img.image_data, // El base64 data URL
          name: img.original_filename, // Para el modal
          file: {
            name: img.original_filename,
            type: img.mime_type,
            size: img.file_size
          }
        }))

        const formattedMessage = {
          text: msg.content,
          isUser: msg.role === 'user',
          isLoading: false,
          isError: msg.is_error || false,
          isTwoStep: msg.is_collapsible || false,
          images: formattedImages
        }
        
        // Si es un mensaje desplegable (isTwoStep), necesitamos separar step1 y step2
        if (formattedMessage.isTwoStep && !formattedMessage.isUser) {
          // Buscar el separador especial
          const parts = msg.content.split('\n\n[STEP_SEPARATOR]\n\n')
          if (parts.length === 2) {
            // Tenemos ambos pasos
            formattedMessage.step1Text = parts[0]
            formattedMessage.step2Text = parts[1]
            formattedMessage.currentStep = 2
            formattedMessage.text = parts[1] // El texto principal es el step2
          } else {
            // Solo tenemos un paso (backward compatibility)
            formattedMessage.step1Text = msg.content
            formattedMessage.step2Text = ''
            formattedMessage.currentStep = 1
          }
        }
        
        return formattedMessage
      })
      
      setMessages(loadedMessages)
      setCurrentChatId(chatId)
      setIsLoading(false)
    } catch (error) {
      console.error('Error al cargar chat:', error)
      setIsLoading(false)
      setMessages([{
        text: 'Error al cargar el chat. Por favor, intenta de nuevo.',
        isUser: false,
        isError: true
      }])
    }
  }

  // Función para crear un nuevo chat vacío
  const handleNewChat = async () => {
    // No permitir crear un nuevo chat si la IA está respondiendo
    if (isLoading) {
      return
    }
    
    // Si hay mensajes en el chat actual y el usuario está autenticado
    if (messages.length > 0 && isAuthenticated) {
      // Actualizar la lista de chats para mostrar el chat que acabamos de usar
      if (leftSidebarRef.current && leftSidebarRef.current.refreshChats) {
        leftSidebarRef.current.refreshChats()
      }
    }
    
    // Crear un nuevo chat vacío
    setMessages([])
    setCurrentChatId(null)
    setImages([])
  }

  const handleSendMessage = async (userMessage) => {
    autoScrollEnabled.current = true
    
    // Si no hay chat activo y el usuario está autenticado, crear uno nuevo
    let chatId = currentChatId
    if (!chatId && isAuthenticated) {
      try {
        const newChat = await chatService.createChat('Nuevo Chat')
        chatId = newChat.id
        setCurrentChatId(chatId)
        // Actualizar la lista de chats en el sidebar
        if (leftSidebarRef.current && leftSidebarRef.current.refreshChats) {
          leftSidebarRef.current.refreshChats()
        }
      } catch (error) {
        console.error('Error al crear chat:', error)
      }
    }
    
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
    
    // Guardar mensaje del usuario inmediatamente en la BD si hay chat activo
    let userMessageId = null
    let shouldGenerateTitle = false
    if (chatId && isAuthenticated) {
      try {
        // Convertir imágenes a formato para guardar en BD
        const imagesToSave = await Promise.all(
          imagesToSend.map(async (img, index) => {
            return new Promise((resolve) => {
              const reader = new FileReader()
              reader.onloadend = () => {
                resolve({
                  name: img.file.name,
                  type: img.file.type,
                  size: img.file.size,
                  data: reader.result, // Base64 data URL
                })
              }
              reader.readAsDataURL(img.file)
            })
          })
        )

        console.log('Imágenes a guardar:', imagesToSave.length, imagesToSave.map(i => ({ name: i.name, size: i.size })))

        const savedUserMessage = await chatService.createMessage(
          chatId, 
          'user', 
          userMessage, 
          false,  // isError
          false,  // isCollapsible
          imagesToSave
        )
        userMessageId = savedUserMessage.id
        
        console.log('Mensaje guardado con ID:', userMessageId)
        
        // Generar título del chat solo si es el primer mensaje del usuario en un chat nuevo
        // (no si el chat fue cargado desde localStorage o de la BD)
        const isFirstMessageInNewChat = messages.length === 0 && !localStorage.getItem('pendingMessages')
        if (isFirstMessageInNewChat) {
          shouldGenerateTitle = true
          const wordCount = userMessage.trim().split(/\s+/).length
          
          if (wordCount <= 4) {
            // Si tiene 4 palabras o menos, usar el mensaje como título
            await chatService.updateChatTitle(chatId, userMessage.trim())
            
            // Actualizar la lista de chats
            if (leftSidebarRef.current && leftSidebarRef.current.refreshChats) {
              leftSidebarRef.current.refreshChats()
            }
          }
          // Si tiene más de 4 palabras, se generará el título después con la IA
        }
      } catch (error) {
        console.error('Error al guardar mensaje del usuario:', error)
      }
    }
    
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
              const errorMessage = data.slice(8)
              // Si es un error de diagrama no detectado, mostrar fuera del desplegable
              if (errorMessage.includes('No se ha detectado ningún diagrama UML')) {
                // Resetear el estado antes de mostrar el error
                currentStep = 0
                accumulatedText = ''
                step1Text = ''
                step2Text = ''
                
                setMessages(prev => {
                  const newMessages = [...prev]
                  newMessages[aiMessageIndex] = {
                    text: errorMessage,
                    isUser: false,
                    isError: true,
                    isLoading: false
                    // No incluir propiedades de dos pasos
                  }
                  return newMessages
                })
                // Terminar el loop sin lanzar error
                reader.cancel()
                return
              }
              throw new Error(errorMessage)
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
      
      // Guardar mensaje de la IA en la base de datos si hay chat activo
      if (chatId && isAuthenticated) {
        try {
          // Determinar si el mensaje es un error o es desplegable
          // Solo es error si incluye el mensaje específico de diagrama no detectado
          const isErrorMessage = accumulatedText.includes('No se ha detectado ningún diagrama UML')
          // Es desplegable si tenemos step1Text (PlantUML) y no es un error
          const isCollapsibleMessage = step1Text && step1Text.length > 0 && !isErrorMessage
          
          // Si es un mensaje de dos pasos, combinar ambos pasos con un separador
          let contentToSave = accumulatedText
          if (isCollapsibleMessage && step1Text && accumulatedText) {
            contentToSave = `${step1Text}\n\n[STEP_SEPARATOR]\n\n${accumulatedText}`
          }
          
          await chatService.createMessage(
            chatId, 
            'assistant', 
            contentToSave,
            isErrorMessage,
            isCollapsibleMessage
          )
          
          // Generar título usando IA si es el primer mensaje y tiene más de 4 palabras
          if (shouldGenerateTitle) {
            const wordCount = userMessage.trim().split(/\s+/).length
            
            if (wordCount > 4) {
              try {
                // Llamar a la IA para generar un título resumido
                const titlePrompt = `Resume la siguiente petición en máximo 4 palabras para usar como título. Solo responde con el título, sin explicaciones adicionales:\n\n"${userMessage}"`
                
                const formDataTitle = new FormData()
                formDataTitle.append('model', modelToUse)
                formDataTitle.append('prompt', titlePrompt)
                formDataTitle.append('messages', JSON.stringify([]))
                formDataTitle.append('autoMode', 'false')
                
                const titleResponse = await fetchWithAuth('http://localhost:3000/api/generate/stream', {
                  method: 'POST',
                  body: formDataTitle
                })
                
                if (titleResponse.ok) {
                  const reader = titleResponse.body.getReader()
                  const decoder = new TextDecoder()
                  let generatedTitle = ''
                  
                  while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    
                    const chunk = decoder.decode(value, { stream: true })
                    const lines = chunk.split('\n')
                    
                    for (const line of lines) {
                      if (line.startsWith('data: ')) {
                        const data = line.slice(6)
                        if (data === '[DONE]') break
                        if (!data.startsWith('[ERROR]')) {
                          try {
                            const decodedChunk = JSON.parse(data)
                            if (typeof decodedChunk === 'string') {
                              generatedTitle += decodedChunk
                            }
                          } catch (e) {
                            generatedTitle += data
                          }
                        }
                      }
                    }
                  }
                  
                  // Limpiar y limitar el título generado
                  const cleanTitle = generatedTitle.trim().replace(/["']/g, '')
                  const titleWords = cleanTitle.split(/\s+/).slice(0, 4).join(' ')
                  
                  if (titleWords) {
                    await chatService.updateChatTitle(chatId, titleWords)
                  } else {
                    // Si falla, usar las primeras 4 palabras del mensaje original
                    const fallbackTitle = userMessage.trim().split(/\s+/).slice(0, 4).join(' ')
                    await chatService.updateChatTitle(chatId, fallbackTitle)
                  }
                } else {
                  // Si falla, usar las primeras 4 palabras del mensaje original
                  const fallbackTitle = userMessage.trim().split(/\s+/).slice(0, 4).join(' ')
                  await chatService.updateChatTitle(chatId, fallbackTitle)
                }
                
                // Actualizar la lista de chats
                if (leftSidebarRef.current && leftSidebarRef.current.refreshChats) {
                  leftSidebarRef.current.refreshChats()
                }
              } catch (error) {
                console.error('Error al generar título con IA:', error)
                // Fallback: usar las primeras 4 palabras del mensaje original
                const fallbackTitle = userMessage.trim().split(/\s+/).slice(0, 4).join(' ')
                await chatService.updateChatTitle(chatId, fallbackTitle)
                
                if (leftSidebarRef.current && leftSidebarRef.current.refreshChats) {
                  leftSidebarRef.current.refreshChats()
                }
              }
            }
          }
        } catch (error) {
          console.error('Error al guardar mensaje de la IA:', error)
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
      <LeftSidebar 
        ref={leftSidebarRef}
        isOpen={isLeftSidebarOpen} 
        setIsOpen={setIsLeftSidebarOpen}
        isAuthenticated={isAuthenticated}
        isDarkTheme={isDarkTheme}
        onToggleTheme={toggleTheme}
        onChatSelect={handleChatSelect}
        currentChatId={currentChatId}
        onNewChat={handleNewChat}
        hasMessages={messages.length > 0}
        isLoading={isLoading}
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
