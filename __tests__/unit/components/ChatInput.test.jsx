import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatInput from '../../../src/components/ChatInput.jsx';

// Mock simple para los componentes hijos que podrían causar problemas sin contexto o props más complejas.
// Si son ligeros, podríamos renderizarlos tal cual, pero por si acaso.
vi.mock('../../../src/components/ModelSelector', () => ({
  default: () => <div data-testid="model-selector">ModelSelector</div>
}));
vi.mock('../../../src/components/ImageUploader', () => ({
  default: () => <div data-testid="image-uploader">ImageUploader</div>
}));

describe('ChatInput Component - Templates', () => {
  const mockTemplates = [
    { id: 1, title: 'Generar Test', prompt: 'Escribe un test para esta función:' },
    { id: 2, title: 'Explicar Código', prompt: 'Explica qué hace el siguiente código:' }
  ];

  beforeEach(() => {
    // Interceptar llamadas a fetch para simular el servidor
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/templates')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTemplates),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const defaultProps = {
    onSendMessage: vi.fn(),
    isLoading: false,
    selectedModel: 'test-model',
    onModelChange: vi.fn(),
    images: [],
    onImagesChange: vi.fn()
  };

  test('debe cargar las plantillas al montar el componente', async () => {
    render(<ChatInput {...defaultProps} />);

    // Verificar que fetch se llamó para obtener las plantillas
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/templates');
    });
  });

  test('abrir el menú de plantillas muestra las opciones cargadas', async () => {
    render(<ChatInput {...defaultProps} />);

    // Esperar a que se carguen las plantillas
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // Encontrar y hacer clic en el botón de plantillas
    // El botón tiene el title="Ver plantillas"
    const templateBtn = screen.getByTitle('Ver plantillas');
    fireEvent.click(templateBtn);

    // Debe mostrar los títulos de las plantillas
    expect(screen.getByText('Generar Test')).toBeInTheDocument();
    expect(screen.getByText('Explicar Código')).toBeInTheDocument();
  });

  test('al hacer clic en una plantilla, el input cambia a su prompt', async () => {
    render(<ChatInput {...defaultProps} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const templateBtn = screen.getByTitle('Ver plantillas');
    fireEvent.click(templateBtn);

    // Hacer clic en una de las plantillas
    const templateItem = screen.getByText('Generar Test');
    fireEvent.click(templateItem);

    // El input debe tener el texto del prompt de la plantilla
    const textarea = screen.getByPlaceholderText('Escribe tu mensaje...');
    expect(textarea.value).toBe('Escribe un test para esta función:');
  });
});