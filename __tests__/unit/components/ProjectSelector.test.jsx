import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectSelector from '../../../src/components/ProjectSelector.jsx';

describe('ProjectSelector Component', () => {
  const mockProjects = [
    { id: 1, name: 'Proyecto 1' },
    { id: 2, name: 'Proyecto 2' },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelectProject: vi.fn(),
    projects: mockProjects,
    position: { top: 100, left: 100 }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('no renderiza nada si isOpen es false', () => {
    const { container } = render(<ProjectSelector {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  test('renderiza opciones cuando isOpen es true', () => {
    render(<ProjectSelector {...defaultProps} />);
    
    expect(screen.getByText('Nuevo proyecto')).toBeInTheDocument();
    expect(screen.getByText('Proyecto 1')).toBeInTheDocument();
    expect(screen.getByText('Proyecto 2')).toBeInTheDocument();
  });

  test('llama a onSelectProject(null) al hacer clic en Nuevo proyecto', () => {
    render(<ProjectSelector {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Nuevo proyecto'));
    expect(defaultProps.onSelectProject).toHaveBeenCalledWith(null);
  });

  test('llama a onSelectProject(id) al hacer clic en un proyecto existente', () => {
    render(<ProjectSelector {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Proyecto 1'));
    expect(defaultProps.onSelectProject).toHaveBeenCalledWith(1);
    
    fireEvent.click(screen.getByText('Proyecto 2'));
    expect(defaultProps.onSelectProject).toHaveBeenCalledWith(2);
  });

  test('muestra mensaje si no hay proyectos', () => {
    render(<ProjectSelector {...defaultProps} projects={[]} />);
    expect(screen.getByText('No tienes proyectos aún')).toBeInTheDocument();
  });

  test('llama a onClose al hacer clic fuera del menú', () => {
    render(<ProjectSelector {...defaultProps} />);
    
    fireEvent.mouseDown(document);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  test('no llama a onClose al hacer clic dentro del menú', () => {
    render(<ProjectSelector {...defaultProps} />);
    const menu = document.querySelector('.project-selector-menu');
    
    fireEvent.mouseDown(menu);
    
    fireEvent.click(menu);
  });
});