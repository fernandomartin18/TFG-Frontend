import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ImageDropdown from '../../../src/components/ImageDropdown.jsx';

describe('ImageDropdown Component', () => {
  const mockImages = [
    { url: 'img1.png', name: 'imagen1.png' },
    { url: 'img2.png', name: 'un-nombre-de-imagen-muy-largo-para-probar-truncado.png' }
  ];

  const defaultProps = {
    images: mockImages,
    onImageClick: vi.fn(),
    onDeleteImage: vi.fn(),
    onClose: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renderiza las imágenes y trunca nombres largos', () => {
    render(<ImageDropdown {...defaultProps} />);
    
    expect(screen.getByText('imagen1.png')).toBeInTheDocument();
    
    const longName = "un-nombre-de-imagen-...";
    expect(screen.getByText(longName)).toBeInTheDocument();
    
    const thumbnails = screen.getAllByRole('img');
    expect(thumbnails).toHaveLength(2);
    expect(thumbnails[0]).toHaveAttribute('src', 'img1.png');
  });

  test('llama a onImageClick al pulsar en la imagen', () => {
    render(<ImageDropdown {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    // Las imágenes son botones para preview
    fireEvent.click(buttons[0]); 
    
    expect(defaultProps.onImageClick).toHaveBeenCalledWith(0);
  });

  test('llama a onDeleteImage al pulsar eliminar', () => {
    render(<ImageDropdown {...defaultProps} />);
    const deleteButtons = screen.getAllByLabelText('Eliminar');
    
    fireEvent.click(deleteButtons[1]); 
    expect(defaultProps.onDeleteImage).toHaveBeenCalledWith(1);
  });

  test('no muestra botones de eliminar si showDeleteButton=false', () => {
    render(<ImageDropdown {...defaultProps} showDeleteButton={false} />);
    expect(screen.queryByLabelText('Eliminar')).not.toBeInTheDocument();
  });

  test('llama a onClose al hacer clic fuera del componente', () => {
    render(<ImageDropdown {...defaultProps} />);
    fireEvent.mouseDown(document); 
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  test('añade clase showBelow correctamente', () => {
    const { container } = render(<ImageDropdown {...defaultProps} showBelow={true} />);
    expect(container.firstChild).toHaveClass('dropdown-below');
  });
});