import { useState } from 'react'
import PropTypes from 'prop-types'
import '../css/ChatInput.css'

function ChatInput({ onSendMessage, isLoading }) {
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input)
      setInput('')
    }
  }

  return (
    <div className="chat-input-container">
      <div className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
          className="chat-input"
          disabled={isLoading}
        />
        <button 
          type="button" 
          onClick={handleSend}
          className="send-button"
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? '...' : 'Enviar'}
        </button>
      </div>
    </div>
  )
}

ChatInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
}

export default ChatInput
