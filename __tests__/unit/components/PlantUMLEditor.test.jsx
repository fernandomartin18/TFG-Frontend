import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import PlantUMLEditor from '../../../src/components/PlantUMLEditor';

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

describe('PlantUMLEditor Component', () => {
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
    
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
    
    useLocation.mockReturnValue({
        state: { code: 'A -> B', chatId: '123' },
        pathname: '/editor'
    });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <PlantUMLEditor />
      </MemoryRouter>
    );
  };

  it('renders correctly', () => {
    renderComponent();
    expect(screen.getByTestId('kroki-viewer')).toBeInTheDocument();
  });

  it('handles tab changes', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Diagrama'));
    expect(screen.getByTestId('reactflow-viewer')).toBeInTheDocument();
  });

  it('updates code in the editor', () => {
    renderComponent();
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'A -> B \n B -> C' } });
    expect(textarea.value).toBe('A -> B \n B -> C');
  });

  it('handles save button click', () => {
    renderComponent();
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'New Code' } });
    fireEvent.click(screen.getByText('Aceptar'));
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('handles cancel with changes', () => {
    renderComponent();
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Modified' } });
    fireEvent.click(screen.getByText('Cancelar'));
    expect(window.confirm).toHaveBeenCalled();
  });

  it('handles cancel without changes', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Cancelar'));
    expect(window.confirm).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('renders templates tab if createNew', () => {
    useLocation.mockReturnValue({
      state: { code: '', createNew: true },
      pathname: '/editor'
    });
    renderComponent();
    fireEvent.click(screen.getByText('Plantillas'));
    expect(screen.getByText('Nueva plantilla')).toBeInTheDocument();
  });

  it('handles scroll sync', () => {
    renderComponent();
    const textarea = screen.getByRole('textbox');
    fireEvent.scroll(textarea, { target: { scrollTop: 100, scrollLeft: 50 } });
    expect(textarea).toBeInTheDocument();
  });

  it('handles drag logic', () => {
    const { container } = renderComponent();
    // Start drag
    const resizer = container.querySelector('.plantuml-resizer');
    expect(resizer).toBeInTheDocument();
    
    if (resizer) {
      fireEvent.pointerDown(resizer);
      // Move
      fireEvent.mouseMove(document, { clientX: 300 });
      // Stop drag
      fireEvent.mouseUp(document);
    }
  });
});