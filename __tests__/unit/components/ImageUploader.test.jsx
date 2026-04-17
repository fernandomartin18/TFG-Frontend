import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImageUploader from '../../../src/components/ImageUploader.jsx';

// Mock dependencies

vi.mock('../../../src/services/api.service', () => ({
  fetchWithAuth: vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      models: [
        { name: 'Llama3-vision', has_vision: true },
        { name: 'Llama3-text-only', has_vision: false },
        { name: 'Auto', has_vision: true }
      ]
    })
  })
}));

vi.mock('../../../src/components/ImageModal', () => ({
  default: ({ onClose, onDelete }) => (
    <div data-testid="image-modal">
      <button onClick={onClose}>Close Modal</button>
      <button onClick={onDelete}>Delete Modal</button>
    </div>
  )
}));

vi.mock('../../../src/components/ImageDropdown', () => ({
  default: ({ images, onImageClick, onDeleteImage, onClose }) => (
    <div data-testid="image-dropdown">
      <button onClick={() => onImageClick(1)}>Click Image 1</button>
      <button onClick={() => onDeleteImage(1)}>Delete Image 1</button>
      <button onClick={onClose}>Close Dropdown</button>
    </div>
  )
}));

describe('ImageUploader Component', () => {
  const mockImages = [
    { url: 'img0.jpg', name: 'img0.jpg', file: {} },
    { url: 'img1.jpg', name: 'img1.jpg', file: {} },
  ];

  const defaultProps = {
    images: [],
    onImagesChange: vi.fn(),
    selectedModel: 'llava-test',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
  });

  test('renderiza botón de añadir imagen', () => {
    render(<ImageUploader {...defaultProps} />);
    const addBtn = screen.getByTitle('Añadir imagen');
    expect(addBtn).toBeInTheDocument();
    expect(addBtn).not.toBeDisabled();
  });

  test('deshabilita botón si el modelo no tiene visión', () => {
    render(<ImageUploader {...defaultProps} selectedModel="Llama3-text-only" />);
    const addBtn = screen.getByTitle('Selecciona un modelo con visión o Auto para añadir imágenes');
    expect(addBtn).toBeDisabled();
    expect(addBtn).toHaveAttribute('title', 'Selecciona un modelo con visión o Auto para añadir imágenes');
  });

  test('deshabilita botón si ya hay 5 imágenes', () => {
    const fiveImages = Array(5).fill({ url: 't.img', name: 't' });
    render(<ImageUploader {...defaultProps} images={fiveImages} />);
    const addBtn = screen.getByTitle('Máximo 5 imágenes');
    expect(addBtn).toBeDisabled();
  });

  test('activa el input de archivo al hacer clic en añadir', () => {
    render(<ImageUploader {...defaultProps} />);
    const addBtn = screen.getByTitle('Añadir imagen');
    
    const fileInput = document.querySelector('input[type="file"]');
    const clickSpy = vi.spyOn(fileInput, 'click');
    
    fireEvent.click(addBtn);
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  test('sube archivos correctamente limitando a 5', () => {
    const fourImages = Array(4).fill({ url: 't.img', name: 't', file: {} });
    render(<ImageUploader {...defaultProps} images={fourImages} />); // ya tiene 4
    
    const fileInput = document.querySelector('input[type="file"]');
    const files = [
      new File([''], 'file1.png', { type: 'image/png' }),
      new File([''], 'file2.png', { type: 'image/png' })
    ];
    
    // Solo debería dejar subir 1 (porque ya hay 4 y máx es 5)
    fireEvent.change(fileInput, { target: { files } });
    
    expect(defaultProps.onImagesChange).toHaveBeenCalledTimes(1);
    const updatedImages = defaultProps.onImagesChange.mock.calls[0][0];
    expect(updatedImages.length).toBe(5); 
    expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  test('muestra preview cuando hay imágenes', () => {
    render(<ImageUploader {...defaultProps} images={[mockImages[0]]} />);
    const previewBtn = screen.getByTitle('Ver imágenes');
    expect(previewBtn).toBeInTheDocument();
    
    const img = screen.getByAltText('Preview');
    expect(img).toHaveAttribute('src', 'img0.jpg');
    
    // Clic con 1 imagen abre el modal
    fireEvent.click(previewBtn);
    expect(screen.getByTestId('image-modal')).toBeInTheDocument();
  });

  test('muestra dropdown cuando hay más de una imagen y se hace clic en preview', () => {
    render(<ImageUploader {...defaultProps} images={mockImages} />);
    const previewBtn = screen.getByTitle('Ver imágenes');
    
    // Clic con >1 imágenes abre el dropdown
    fireEvent.click(previewBtn);
    expect(screen.getByTestId('image-dropdown')).toBeInTheDocument();
  });

  test('interacciones del dropdown (click e borrar)', () => {
    render(<ImageUploader {...defaultProps} images={mockImages} />);
    
    // Abrir dropdown
    fireEvent.click(screen.getByTitle('Ver imágenes'));
    
    // Clic en imagen del dropdown
    fireEvent.click(screen.getByText('Click Image 1'));
    // Debería cerrar dropdown y abrir modal
    expect(screen.queryByTestId('image-dropdown')).not.toBeInTheDocument();
    expect(screen.getByTestId('image-modal')).toBeInTheDocument();
    
    // Abrir dropdown nuevamente y borrar
    fireEvent.click(screen.getByTitle('Ver imágenes'));
    fireEvent.click(screen.getByText('Delete Image 1'));
    
    expect(defaultProps.onImagesChange).toHaveBeenCalledWith([mockImages[0]]); // borró índex 1
  });

  test('interacciones del modal (cerrar y borrar)', () => {
    const { unmount } = render(<ImageUploader {...defaultProps} images={[mockImages[0]]} />);
    
    // Abrir modal
    fireEvent.click(screen.getByTitle('Ver imágenes'));
    
    // Cerrar
    fireEvent.click(screen.getByText('Close Modal'));
    expect(screen.queryByTestId('image-modal')).not.toBeInTheDocument();
  });
  
  test('interacciones del modal (borrar)', () => {
    render(<ImageUploader {...defaultProps} images={[mockImages[0]]} />);
    
    // Abrir modal
    fireEvent.click(screen.getByTitle('Ver imágenes'));
    
    // Borrar
    fireEvent.click(screen.getByText('Delete Modal'));
    expect(defaultProps.onImagesChange).toHaveBeenCalledWith([]);
  });
});