import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ModelSelector from '../../../src/components/ModelSelector.jsx';
import { fetchWithAuth } from '../../../src/services/api.service';

vi.mock('../../../src/services/api.service', () => ({
  fetchWithAuth: vi.fn(),
}));

describe('ModelSelector Component', () => {
  const defaultProps = {
    selectedModel: '',
    onModelChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renderiza botón principal', () => {
    fetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ models: [] }),
    });

    render(<ModelSelector {...defaultProps} selectedModel="Llama3" />);
    expect(screen.getByText('Modelo')).toBeInTheDocument();
    expect(screen.getByText('Llama3')).toBeInTheDocument();
  });

  test('abre y cierra dropdown al hacer click', async () => {
    fetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ models: [] }),
    });

    render(<ModelSelector {...defaultProps} />);
    const button = screen.getByRole('button', { name: /Modelo/i });

    // Abrir
    fireEvent.click(button);
    expect(screen.getByTitle('Información sobre modelos')).toBeInTheDocument();

    // Cerrar al hacer click fuera
    fireEvent.mouseDown(document);
    await waitFor(() => {
      expect(screen.queryByTitle('Información sobre modelos')).not.toBeInTheDocument();
    });
  });

  test('llama a la API para obtener modelos y auto mode al montar', async () => {
    fetchWithAuth.mockImplementation((url) => {
      if (url.includes('/auto-select')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ auto_available: true }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ models: [{ name: 'Model1' }, { name: 'Model2' }] }) });
    });

    render(<ModelSelector {...defaultProps} />);

    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith('http://localhost:3000/api/models');
      expect(fetchWithAuth).toHaveBeenCalledWith('http://localhost:3000/api/models/auto-select');
    });
    
    await waitFor(() => {
        expect(defaultProps.onModelChange).toHaveBeenCalledWith('Auto');
    });
  });

  test('selecciona Auto o Model1 correctamente si no hay modelo seleccionado (con Auto no disponible)', async () => {
    fetchWithAuth.mockImplementation((url) => {
      if (url.includes('/auto-select')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ auto_available: false }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ models: [{ name: 'Model1' }] }) });
    });

    render(<ModelSelector {...defaultProps} />);

    await waitFor(() => {
      expect(defaultProps.onModelChange).toHaveBeenCalledWith('Model1');
    });
  });

  test('muestra modal de información', async () => {
    fetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ models: [] }),
    });

    render(<ModelSelector {...defaultProps} />);
    
    // Abrir dropdown
    const button = screen.getByRole('button', { name: /Modelo/i });
    fireEvent.click(button);

    // Abrir info modal
    const infoButton = screen.getByTitle('Información sobre modelos');
    fireEvent.click(infoButton);

    expect(screen.getByText(/Aquí se mostrarán los modelos que tengas instalados en Ollama/i)).toBeInTheDocument();

    // Cerrar modal
    const closeBtn = screen.getByTitle('Cerrar');
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/Aquí se mostrarán los modelos/i)).not.toBeInTheDocument();
  });

  test('selecciona Auto y se dispara onModelChange y cierra al hacer click', async () => {
    fetchWithAuth.mockImplementation(async (url) => {
      if (url.includes('/auto-select')) {
        return { ok: true, json: () => Promise.resolve({ auto_available: true }) };
      }
      return { ok: true, json: () => Promise.resolve({ models: [{ name: 'Model1' }] }) };
    });

    render(<ModelSelector {...defaultProps} selectedModel="Model1" />);
    
    // Abrir dropdown
    const button = screen.getByRole('button', { name: /Modelo/i });
    fireEvent.click(button);

    // Click Auto
    const autoOption = await screen.findByText('Auto');
    fireEvent.click(autoOption);
    expect(defaultProps.onModelChange).toHaveBeenCalledWith('Auto');
  });

  test('selecciona modelo via Enter en teclado', async () => {
    fetchWithAuth.mockImplementation(async (url) => {
      if (url.includes('/auto-select')) {
        return { ok: true, json: () => Promise.resolve({ auto_available: true }) };
      }
      return { ok: true, json: () => Promise.resolve({ models: [{ name: 'Model1' }] }) };
    });

    render(<ModelSelector {...defaultProps} selectedModel="Auto" />);
    
    const button = screen.getByRole('button', { name: /Modelo/i });
    fireEvent.click(button);

    const modelOption = await screen.findByText('Model1');
    fireEvent.keyDown(modelOption, { key: 'Enter' });
    expect(defaultProps.onModelChange).toHaveBeenCalledWith('Model1');
    
    fireEvent.click(button);
    const modelOption2 = await screen.findByText('Model1');
    fireEvent.keyDown(modelOption2, { key: ' ' });
    expect(defaultProps.onModelChange).toHaveBeenCalledWith('Model1');
    
    fireEvent.click(button);
    const autoOptions = await screen.findAllByText('Auto');
    fireEvent.keyDown(autoOptions[autoOptions.length - 1], { key: 'Enter' });
    expect(defaultProps.onModelChange).toHaveBeenCalledWith('Auto');
    
    fireEvent.click(button);
    const autoOptions2 = await screen.findAllByText('Auto');
    fireEvent.keyDown(autoOptions2[autoOptions2.length - 1], { key: ' ' });
    expect(defaultProps.onModelChange).toHaveBeenCalledWith('Auto');
  });

  test('maneja error en fetchModels y checkAutoMode', async () => {
    let callCount = 0;
    fetchWithAuth.mockImplementation(async () => {
      callCount++;
      if (callCount <= 2) {
        throw new Error('API error');
      }
      return { ok: false };
    });
    const { container } = render(<ModelSelector {...defaultProps} />);
    
    await waitFor(() => {
      expect(defaultProps.onModelChange).toHaveBeenCalledWith('No hay LLMs');
    });
  });

  test('cierra el info modal al presionar Escape o hacer click en backdrop', async () => {
    fetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ models: [] }),
    });

    render(<ModelSelector {...defaultProps} selectedModel="Llama3" />);
    
    // Abrir dropdown
    const button = screen.getByRole('button', { name: /Modelo/i });
    fireEvent.click(button);

    // Abrir info modal
    const infoButton = await screen.findByTitle('Información sobre modelos');
    fireEvent.click(infoButton);

    // Cerrar al presionar escape
    const backdrop = document.querySelector('.info-modal-backdrop');
    fireEvent.keyDown(backdrop, { key: 'Escape' });
    expect(screen.queryByText(/Aquí se mostrarán los modelos que tengas instalados en Ollama/i)).not.toBeInTheDocument();

    // Abrir de nuevo infomodal y click backdrop
    fireEvent.click(screen.getByTitle('Información sobre modelos'));
    
    const newBackdrop = document.querySelector('.info-modal-backdrop');
    fireEvent.click(newBackdrop);
    expect(screen.queryByText(/Aquí/i)).not.toBeInTheDocument();
  });


  test('Abre modal de configuración modo automático y permite testarlo y cambiar opciones', async () => {
    fetchWithAuth.mockImplementation(async (url) => {
      if (url.includes('/auto-select')) {
        return { ok: true, json: () => Promise.resolve({ auto_available: true, visionModels: [], codingModels: [] }) };
      }
      return { ok: true, json: () => Promise.resolve({ models: [{ name: 'Model1' }] }) };
    });

    const onAutoModeConfigChangeMock = vi.fn();
    
    render(<ModelSelector {...defaultProps} selectedModel="Auto" autoModeConfig={{ automaticOllamaVisionModel: 'vision-model', automaticOllamaCodingModel: 'coding-model' }} onAutoModeConfigChange={onAutoModeConfigChangeMock} />);

    // Abrir dropdown
    const button = screen.getByRole('button', { name: /Modelo/i });
    fireEvent.click(button);

    // Open cog icon
    const configBtn = await screen.findByTitle('Configurar modo Auto');
    fireEvent.click(configBtn);

    // Modal is opened
    expect(screen.getByText('Configuración Modo Auto')).toBeInTheDocument();

    const customRadio = screen.getByLabelText('Personalizado');
    fireEvent.click(customRadio);

    expect(onAutoModeConfigChangeMock).toHaveBeenCalled();
  });
});
