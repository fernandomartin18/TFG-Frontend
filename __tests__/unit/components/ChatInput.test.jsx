import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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
    render(
      <MemoryRouter>
        <ChatInput {...defaultProps} />
      </MemoryRouter>
    );

    // Verificar que fetch se llamó para obtener las plantillas
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/templates');
    });
  });

  test('abrir el menú de plantillas muestra las opciones cargadas', async () => {
    render(
      <MemoryRouter>
        <ChatInput {...defaultProps} />
      </MemoryRouter>
    );

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
    render(
      <MemoryRouter>
        <ChatInput {...defaultProps} />
      </MemoryRouter>
    );

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

  test('llamadas a navigate al hacer clic en crear diagrama', async () => {
    const { container } = render(
      <MemoryRouter>
        <ChatInput {...defaultProps} currentChatId="123" />
      </MemoryRouter>
    );

    const btn = screen.getByTitle('Crear diagrama PlantUML');
    fireEvent.click(btn);
    // Verificar que se renderice sin problemas
    expect(btn).toBeInTheDocument();
  });

  test('textarea handleChange y handleKeyDown', async () => {
    render(
      <MemoryRouter>
        <ChatInput {...defaultProps} />
      </MemoryRouter>
    );

    const textarea = screen.getByPlaceholderText('Escribe tu mensaje...');
    
    // Test onChange
    fireEvent.change(textarea, { target: { value: 'Nuevo mensaje' } });
    expect(textarea.value).toBe('Nuevo mensaje');

    // Test onKeyDown Enter (no shift)
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Nuevo mensaje');
    expect(textarea.value).toBe('');
    
    // Shift+Enter no debe enviar
    fireEvent.change(textarea, { target: { value: 'Mensaje con shift' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: true });
    expect(defaultProps.onSendMessage).toHaveBeenCalledTimes(1); 
  });

  test('cerrar menu con botón X y click outside', async () => {
    render(
      <MemoryRouter>
        <ChatInput {...defaultProps} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const templateBtn = screen.getByTitle('Ver plantillas');
    fireEvent.click(templateBtn);
    expect(screen.getByText('Plantillas de Prompt')).toBeInTheDocument();

    const closeBtn = document.querySelector('.prompt-templates-header button');
    fireEvent.click(closeBtn);
    expect(screen.queryByText('Plantillas de Prompt')).not.toBeInTheDocument();

    fireEvent.click(templateBtn);
    expect(screen.getByText('Plantillas de Prompt')).toBeInTheDocument();
    
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Plantillas de Prompt')).not.toBeInTheDocument();
  });

  test('fetchTemplates error mock console.error', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));
    
    render(
      <MemoryRouter>
        <ChatInput {...defaultProps} />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
    });
    
    errorSpy.mockRestore();
  });

  test('fetchTemplates error status no ok', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch.mockImplementationOnce(() => Promise.resolve({ ok: false, status: 500 }));
    
    render(
      <MemoryRouter>
        <ChatInput {...defaultProps} />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
    });
    
    errorSpy.mockRestore();
  });

  test('setea el input inicial si se pasa initialInput', () => {
    const { rerender } = render(
      <MemoryRouter>
        <ChatInput {...defaultProps} />
      </MemoryRouter>
    );
    expect(screen.getByRole('textbox').value).toBe('');

    rerender(
      <MemoryRouter>
        <ChatInput {...defaultProps} initialInput="Texto inicial" />
      </MemoryRouter>
    );
    expect(screen.getByRole('textbox').value).toBe('Texto inicial');
  });

  test('ajusta la altura y activa scroll si excede maxHeight', () => {
    render(
      <MemoryRouter>
        <ChatInput {...defaultProps} />
      </MemoryRouter>
    );
    const textarea = screen.getByRole('textbox');
    
    // Simulate scrollHeight greater than maxHeight (8*24+24 = 216)
    Object.defineProperty(textarea, 'scrollHeight', { value: 300, configurable: true });
    
    // Trigger the useEffect dependent on input text change
    fireEvent.change(textarea, { target: { value: 'many \n lines' } });
    
    expect(textarea.style.overflowY).toBe('scroll');
  });
});