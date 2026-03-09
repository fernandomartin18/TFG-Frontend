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
});