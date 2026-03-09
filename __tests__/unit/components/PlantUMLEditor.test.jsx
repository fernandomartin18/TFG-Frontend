import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PlantUMLEditor from '../../../src/components/PlantUMLEditor';

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({
      state: { code: 'A -> B', chatId: '123' },
      pathname: '/editor'
    })
  };
});

vi.mock('../../../src/components/KrokiViewer', () => ({
  default: () => <div data-testid="kroki-viewer">Kroki Viewer</div>
}));

vi.mock('../../../src/components/ReactFlowViewer', () => ({
  default: () => <div data-testid="reactflow-viewer">ReactFlow Viewer</div>
}));

vi.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }) => <div>{children}</div>
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
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <PlantUMLEditor />
      </BrowserRouter>
    );
  };

  it('renders correctly with default state', () => {
    renderComponent();
    expect(screen.getByTestId('kroki-viewer')).toBeInTheDocument();
  });

  it('handles tab changes', () => {
    renderComponent();
    
    expect(screen.getByTestId('kroki-viewer')).toBeInTheDocument();
    
    const diagramaTab = screen.getByText('Diagrama');
    fireEvent.click(diagramaTab);
    
    expect(screen.getByTestId('reactflow-viewer')).toBeInTheDocument();
    expect(screen.queryByTestId('kroki-viewer')).not.toBeInTheDocument();
  });

  it('updates code in the editor', () => {
    renderComponent();
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'A -> B \\n B -> C' } });
    
    expect(textarea.value).toBe('A -> B \\n B -> C');
  });

  it('handles save button click to navigate back', () => {
    renderComponent();
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'New Code' } });
    
    const acceptBtn = screen.getByText('Aceptar');
    expect(acceptBtn).not.toBeDisabled();
    
    fireEvent.click(acceptBtn);
  });
});
