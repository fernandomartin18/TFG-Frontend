import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { PiDotsThreeVerticalBold } from 'react-icons/pi'
import { MdEdit } from 'react-icons/md'
import { BsFillPinAngleFill } from 'react-icons/bs'
import { RiUnpinFill } from 'react-icons/ri'
import { FaTrash } from 'react-icons/fa6'
import '../css/ChatOptionsMenu.css'

const ChatOptionsMenu = ({ chat, onEdit, onTogglePin, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(chat.title)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const menuRef = useRef(null)
  const buttonRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false)
        setShowDeleteConfirm(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleToggleMenu = (e) => {
    e.stopPropagation()
    setIsMenuOpen(!isMenuOpen)
    setShowDeleteConfirm(false)
  }

  const handleEditClick = (e) => {
    e.stopPropagation()
    setIsEditing(true)
    setIsMenuOpen(false)
  }

  const handleEditSave = async (e) => {
    e.stopPropagation()
    if (editTitle.trim() && editTitle.trim() !== chat.title) {
      await onEdit(chat.id, editTitle.trim())
    }
    setIsEditing(false)
  }

  const handleEditCancel = (e) => {
    e.stopPropagation()
    setEditTitle(chat.title)
    setIsEditing(false)
  }

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleEditSave(e)
    } else if (e.key === 'Escape') {
      handleEditCancel(e)
    }
  }

  const handlePinClick = async (e) => {
    e.stopPropagation()
    await onTogglePin(chat.id, !chat.pinned)
    setIsMenuOpen(false)
  }

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async (e) => {
    e.stopPropagation()
    await onDelete(chat.id)
    setIsMenuOpen(false)
    setShowDeleteConfirm(false)
  }

  const handleDeleteCancel = (e) => {
    e.stopPropagation()
    setShowDeleteConfirm(false)
  }

  if (isEditing) {
    return (
      <div className="chat-edit-container" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          className="chat-edit-input"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleEditKeyDown}
          onBlur={handleEditSave}
          maxLength={255}
        />
      </div>
    )
  }

  return (
    <div className="chat-options-wrapper">
      <button
        ref={buttonRef}
        className="chat-options-button"
        onClick={handleToggleMenu}
        aria-label="Opciones del chat"
      >
        <PiDotsThreeVerticalBold />
      </button>

      {isMenuOpen && (
        <div ref={menuRef} className="chat-options-menu" onClick={(e) => e.stopPropagation()}>
          {!showDeleteConfirm ? (
            <>
              <button className="chat-option-item" onClick={handleEditClick}>
                <MdEdit className="option-icon" />
                <span>Editar título</span>
              </button>
              <button className="chat-option-item" onClick={handlePinClick}>
                {chat.pinned ? (
                  <>
                    <RiUnpinFill className="option-icon" />
                    <span>Desfijar</span>
                  </>
                ) : (
                  <>
                    <BsFillPinAngleFill className="option-icon" />
                    <span>Fijar</span>
                  </>
                )}
              </button>
              <button className="chat-option-item delete" onClick={handleDeleteClick}>
                <FaTrash className="option-icon" />
                <span>Eliminar</span>
              </button>
            </>
          ) : (
            <div className="delete-confirm">
              <p className="delete-confirm-text">¿Eliminar este chat?</p>
              <div className="delete-confirm-buttons">
                <button className="delete-confirm-button cancel" onClick={handleDeleteCancel}>
                  Cancelar
                </button>
                <button className="delete-confirm-button confirm" onClick={handleDeleteConfirm}>
                  Eliminar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

ChatOptionsMenu.propTypes = {
  chat: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    pinned: PropTypes.bool,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onTogglePin: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
}

export default ChatOptionsMenu
