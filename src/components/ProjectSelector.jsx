import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { FaFolderOpen, FaFolderPlus } from 'react-icons/fa'
import '../css/ProjectSelector.css'

const ProjectSelector = ({ isOpen, onClose, onSelectProject, projects, position }) => {
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const style = position ? {
    position: 'fixed',
    top: `${position.top}px`,
    left: `${position.left}px`,
  } : {}

  return (
    <div
      ref={menuRef}
      className="project-selector-menu"
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Opción para crear nuevo proyecto */}
      <button
        className="project-selector-item new-project"
        onClick={() => onSelectProject(null)}
      >
        <FaFolderPlus className="project-selector-icon" />
        <span>Nuevo proyecto</span>
      </button>

      {/* Lista de proyectos existentes */}
      {projects.map((project) => (
        <button
          key={project.id}
          className="project-selector-item"
          onClick={() => onSelectProject(project.id)}
        >
          <FaFolderOpen className="project-selector-icon" />
          <span>{project.name}</span>
        </button>
      ))}

      {/* Mensaje si no hay proyectos */}
      {(!projects || projects.length === 0) && (
        <div className="project-selector-empty">
          No tienes proyectos aún
        </div>
      )}
    </div>
  )
}

ProjectSelector.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelectProject: PropTypes.func.isRequired,
  projects: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  position: PropTypes.shape({
    top: PropTypes.number,
    left: PropTypes.number,
  }),
}

export default ProjectSelector
