import PropTypes from 'prop-types'
import '../css/ThemeToggle.css'

function ThemeToggle({ isDark, onToggle }) {
  return (
    <button 
      className="theme-toggle"
      onClick={onToggle}
      aria-label="Toggle theme"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}

ThemeToggle.propTypes = {
  isDark: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired
}

export default ThemeToggle
