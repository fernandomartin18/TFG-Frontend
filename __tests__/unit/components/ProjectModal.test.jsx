import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ProjectModal from '../../../src/components/ProjectModal.jsx';

describe('ProjectModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    initialName: '',
    title: 'Nuevo proyecto'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('no se renderiza si isOpen es false', () => {
    const { container } = render(<ProjectModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  test('se renderiza correctamente si isOpen es true', () => {
    render(<ProjectModal {...defaultProps} />);
    expect(screen.getByText('Nuevo proyecto')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nombre del proyecto')).toBeInTheDocument();
  });

  test('llama a onClose al hacer clic en el overlay', () => {
    render(<ProjectModal {...defaultProps} />);
    const overlay = document.querySelector('.project-modal-overlay');
    fireEvent.click(overlay);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  test('no llama a onClose al hacer clic dentro del modal', () => {
    render(<ProjectModal {...defaultProps} />);
    const modal = document.querySelector('.project-modal');
    fireEvent.click(modal);
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  test('actualiza el input al escribir', () => {
    render(<ProjectModal {...defaultProps} />);
    const input = screen.getByPlaceholderText('Nombre del proyecto');
    fireEvent.change(input, { target: { value: 'Nuevo test' } });
    expect(input.value).toBe('Nuevo test');
  });

  test('llama a onSave con el nombre y cierra el modal al enviar', () => {
    render(<ProjectModal {...defaultProps} />);
    const input = screen.getByPlaceholderText('Nombre del proyecto');
    fireEvent.change(input, { target: { value: 'Mi Proyecto' } });
    
    const form = document.querySelector('form');
    fireEvent.submit(form);
    
    expect(defaultProps.onSave).toHaveBeenCalledWith('Mi Proyecto');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  test('no envía si el input está vacío o solo tiene espacios', () => {
    render(<ProjectModal {...defaultProps} />);
    const input = screen.getByPlaceholderText('Nombre del proyecto');
    fireEvent.change(input, { target: { value: '   ' } });
    
    const form = document.querySelector('form');
    fireEvent.submit(form);
    
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  test('llama a onClose al presionar Escape', () => {
    render(<ProjectModal {...defaultProps} />);
    const input = screen.getByPlaceholderText('Nombre del proyecto');
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  test('el botón de guardar se deshabilita si el input está vacío', () => {
    render(<ProjectModal {...defaultProps} />);
    const saveButton = screen.getByText('Guardar');
    expect(saveButton).toBeDisabled();

    const input = screen.getByPlaceholderText('Nombre del proyecto');
    fireEvent.change(input, { target: { value: 'Valor válido' } });
    expect(saveButton).not.toBeDisabled();
  });

  test('llama a onClose al presionar el botón Cancelar', () => {
    render(<ProjectModal {...defaultProps} />);
    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  test('maneja focus y setTimeout al montarse', () => {
    vi.useFakeTimers();
    render(<ProjectModal {...defaultProps} isOpen={true} />);
    
    // Avanzar el timer
    act(() => {
      vi.runAllTimers();
    });
    
    const input = screen.getByPlaceholderText('Nombre del proyecto');
    expect(document.activeElement).toBe(input);
    
    vi.useRealTimers();
  });

  test('maneja eventos de teclado en el overlay', () => {
    const { container } = render(<ProjectModal {...defaultProps} />);
    const overlay = container.querySelector('.project-modal-overlay');
    
    fireEvent.keyDown(overlay, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(overlay, { key: 'Enter' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});