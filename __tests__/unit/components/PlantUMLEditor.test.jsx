import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import PlantUMLEditor from '../../../src/components/PlantUMLEditor';
import { plantUmlService } from '../../../src/services/plantuml.service.js';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: vi.fn(),
  };
});

vi.mock('../../../src/components/KrokiViewer', () => ({
  default: () => <div data-testid='kroki-viewer'>Kroki Viewer</div>
}));

vi.mock('../../../src/components/ReactFlowViewer', () => ({
  default: () => <div data-testid='reactflow-viewer'>ReactFlow Viewer</div>
}));

vi.mock('../../../src/components/CodeSidebar', () => ({
  default: () => <div data-testid='code-sidebar'>Code Sidebar</div>
}));

vi.mock('../../../src/services/plantuml.service.js', () => {
  const mService = {
    getTemplates: vi.fn(),
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn()
  };
  return {
    plantUmlService: mService,
    default: mService
  };
});

describe('PlantUMLEditor Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
      })),
    });
    
    window.confirm = vi.fn(() => true);
    
    useLocation.mockReturnValue({
        state: { code: 'A -> B', chatId: '123', createNew: true },
        pathname: '/editor'
    });

    plantUmlService.getTemplates.mockResolvedValue({ success: true, templates: [] });
  });

  const renderComponent = () => render(<MemoryRouter><PlantUMLEditor /></MemoryRouter>);

  it('renders correctly and handles text change', () => {
    renderComponent();
    expect(screen.getByTestId('kroki-viewer')).toBeInTheDocument();
    
    const textarea = document.querySelector('textarea.plantuml-textarea');
    fireEvent.change(textarea, { target: { value: 'New Code' } });
    expect(textarea.value).toBe('New Code');
  });

  it('handles tab changes', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Código'));
    fireEvent.click(screen.getByText('Diagrama'));
    expect(screen.getByTestId('reactflow-viewer')).toBeInTheDocument();
  });

  it('handles save and cancel buttons', () => {
    renderComponent();
    const cancelBtn = screen.getByText('Cancelar');
    fireEvent.click(cancelBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/', { state: { returnToChatId: '123' }});

    const saveBtn = screen.getByText('Aceptar');
    fireEvent.click(saveBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/', { state: { editedCode: 'A -> B', plantumlCreated: true, plantumlEdited: false, returnToChatId: '123' }});
  });

  it('renders templates tab and fetches templates', async () => {
    const mockTemplates = [
      { id: 1, title: 'Diagrama ER', code: 'entity A', user_id: 1 }
    ];
    plantUmlService.getTemplates.mockResolvedValue({ success: true, templates: mockTemplates });
    
    renderComponent();
    fireEvent.click(screen.getByText('Plantillas'));
    
    await waitFor(() => {
      expect(screen.getByText('Diagrama ER')).toBeInTheDocument();
    });
    
    // Select it
    const templateItem = screen.getByText('Diagrama ER');
    fireEvent.click(templateItem);
    
    // Use it
    const useBtn = screen.getByText(/Usar/i);
    fireEvent.click(useBtn);

    // Ensure state updated and tab switched
    expect(document.querySelector('textarea.plantuml-textarea').value).toBe('entity A');
  });

  it('creates a template', async () => {
    plantUmlService.getTemplates.mockResolvedValue({ success: true, templates: [] });
    plantUmlService.createTemplate.mockResolvedValue({ success: true, template: { id: 2, title: 'New Temp', code: 'A -> B' } });

    useLocation.mockReturnValue({
      state: { code: '', createNew: true },
      pathname: '/editor'
    });

    renderComponent();
    fireEvent.click(screen.getByText('Plantillas'));
    
    await waitFor(() => expect(plantUmlService.getTemplates).toHaveBeenCalled());

    // Start creating template
    const createBtn = screen.getByText('Nueva plantilla');
    fireEvent.click(createBtn);

    // Edit inputs inside form
    const inputs = await screen.findAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'New Temp' } });
    fireEvent.change(inputs[1], { target: { value: 'A -> B' } });

    // Save
    fireEvent.click(screen.getByText('Guardar'));

    await waitFor(() => {
      expect(plantUmlService.createTemplate).toHaveBeenCalledWith({
        title: 'New Temp',
        code: 'A -> B'
      });
    });
  });

  
  it('validates empty title or code on save template and catches errors', async () => {
    plantUmlService.getTemplates.mockResolvedValueOnce({ success: true, templates: [] });
    window.alert = vi.fn();

    useLocation.mockReturnValue({
      state: { createNew: true },
      pathname: '/editor'
    });

    render(<MemoryRouter><PlantUMLEditor /></MemoryRouter>);
    
    fireEvent.click(screen.getByText('Plantillas'));
    await waitFor(() => {
      expect(screen.getByText('Nueva plantilla')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Nueva plantilla'));
    
    // Clear the left input and the right textarea just in case
    const titleInput = screen.getByPlaceholderText('Escribe el título...');
    const codeArea = document.querySelector('textarea.plantuml-textarea');
    fireEvent.change(titleInput, { target: { value: '' } });
    fireEvent.change(codeArea, { target: { value: '' } });

    fireEvent.click(screen.getByText('Guardar'));

    expect(window.alert).toHaveBeenCalledWith('Por favor, pon un título y un código a tu plantilla.');

    plantUmlService.createTemplate.mockRejectedValueOnce(new Error('Network error'));
    
    fireEvent.change(titleInput, { target: { value: 'Title' } });
    fireEvent.change(codeArea, { target: { value: 'Code' } });

    fireEvent.click(screen.getByText('Guardar'));
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Error al guardar la plantilla: Network error');
    });
  });

  it('handles error when loading templates', async () => {
    plantUmlService.getTemplates.mockRejectedValueOnce(new Error('Failed to load'));
    
    useLocation.mockReturnValue({
      state: { createNew: true },
      pathname: '/editor'
    });

    render(<MemoryRouter><PlantUMLEditor /></MemoryRouter>);
    fireEvent.click(screen.getByText('Plantillas'));
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
    });
  });

  it('cancels template creation', async () => {
    plantUmlService.getTemplates.mockResolvedValueOnce({ success: true, templates: [] });

    useLocation.mockReturnValue({
      state: { createNew: true },
      pathname: '/editor'
    });

    render(<MemoryRouter><PlantUMLEditor /></MemoryRouter>);
    fireEvent.click(screen.getByText('Plantillas'));
    
    await waitFor(() => {
      expect(screen.getByText('Nueva plantilla')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Nueva plantilla'));
    expect(screen.queryByText('Nueva plantilla')).not.toBeInTheDocument();

    const buttons = screen.getAllByText('Cancelar');
    fireEvent.click(buttons[buttons.length - 1]); 

    expect(screen.getByText('Nueva plantilla')).toBeInTheDocument();
  });
});
