import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import '../css/ProjectModal.css'

const ProjectModal = ({ isOpen, onClose, onSave, initialName = '', title = 'Nuevo proyecto' }) => {
  const [projectName, setProjectName] = useState(initialName)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setProjectName(initialName)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, initialName])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (projectName.trim()) {
      onSave(projectName.trim())
      setProjectName('')
      onClose()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="project-modal-overlay" 
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }}
      role="presentation"
    >
      <div 
        className="project-modal" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation()
          }
        }}
        role="presentation"
      >
        <h3 className="project-modal-title">{title}</h3>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="project-modal-input"
            placeholder="Nombre del proyecto"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={255}
          />
          <div className="project-modal-buttons">
            <button
              type="button"
              className="project-modal-button cancel"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="project-modal-button save"
              disabled={!projectName.trim()}
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

ProjectModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  initialName: PropTypes.string,
  title: PropTypes.string,
}

export default ProjectModal
