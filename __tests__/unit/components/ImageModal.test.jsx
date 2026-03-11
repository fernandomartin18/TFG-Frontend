import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ImageModal from '../../../src/components/ImageModal.jsx';

vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (node) => node,
  };
});

describe('ImageModal Component', () => {
  const mockImage = {
    name: 'test-image.png',
    url: 'http://example.com/test-image.png'
  };

  const defaultProps = {
    image: mockImage,
    onClose: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('se renderiza correctamente la imagen y el título', () => {
    render(<ImageModal {...defaultProps} />);
    
    expect(screen.getByText('test-image.png')).toBeInTheDocument();
    
    const imgElement = screen.getByAltText('test-image.png');
    expect(imgElement).toBeInTheDocument();
    expect(imgElement).toHaveAttribute('src', 'http://example.com/test-image.png');
  });

  test('llama a onClose al hacer clic en el botón de cerrar', () => {
    render(<ImageModal {...defaultProps} />);
    
    const closeBtn = screen.getByLabelText('Cerrar');
    fireEvent.click(closeBtn);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  test('llama a onClose al hacer clic en el fondo (backdrop)', () => {
    render(<ImageModal {...defaultProps} />);
    
    const backdrop = document.querySelector('.image-modal-backdrop');
    fireEvent.click(backdrop);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  test('no llama a onClose al hacer clic dentro del modal', () => {
    render(<ImageModal {...defaultProps} />);
    
    const modalContent = document.querySelector('.image-modal');
    fireEvent.click(modalContent);
    
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  test('muestra el botón de eliminar por defecto y llama a onDelete al hacer clic', () => {
    render(<ImageModal {...defaultProps} />);
    
    const deleteBtn = screen.getByText('Eliminar');
    expect(deleteBtn).toBeInTheDocument();
    
    fireEvent.click(deleteBtn);
    expect(defaultProps.onDelete).toHaveBeenCalledTimes(1);
  });

  test('no muestra el botón de eliminar si showDeleteButton es false', () => {
    render(<ImageModal {...defaultProps} showDeleteButton={false} />);
    
    expect(screen.queryByText('Eliminar')).not.toBeInTheDocument();
  });
});