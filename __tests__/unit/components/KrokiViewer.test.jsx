import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import KrokiViewer from '../../../src/components/KrokiViewer.jsx';

vi.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children }) => <div data-testid="transform-wrapper">{children}</div>,
  TransformComponent: ({ children }) => <div data-testid="transform-component">{children}</div>
}));

describe('KrokiViewer Component', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test('muestra mensaje de código vacío inicialmente o si no hay código', async () => {
    const { rerender } = render(<KrokiViewer code="initial space" />);
    // change code to empty to trigger the timeout effect
    rerender(<KrokiViewer code="   " />);
    
    act(() => {
        vi.advanceTimersByTime(850);
    });

    expect(screen.getByText('El código está vacío. Escribe PlantUML para ver el diagrama.')).toBeInTheDocument();
  });

  test('renderiza un diagrama SVG cuando la petición de red tiene éxito', async () => {
    let resolveMock;
    const p = new Promise(r => resolveMock = r);
    global.fetch.mockReturnValue(p);

    render(<KrokiViewer code="class User {}" />);
    
    act(() => {
        vi.advanceTimersByTime(850); // dispara el timeout
    });

    expect(screen.getByText('Renderizando...')).toBeInTheDocument();

    await act(async () => {
        resolveMock({
            ok: true,
            text: () => Promise.resolve('<svg>diagrama</svg>')
        });
        await p; // let promise resolve
    });

    expect(global.fetch).toHaveBeenCalled();
    expect(screen.queryByText('Renderizando...')).toBeNull();
  });

  test('muestra mensaje de error cuando falla la petición al servidor', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false });

    render(<KrokiViewer code="class User {" />);

    await act(async () => {
        vi.advanceTimersByTime(850);
        await Promise.resolve(); // trigger promises
        await Promise.resolve();
    });

    expect(screen.getByText('Error de sintaxis: No se pudo renderizar el diagrama PlantUML de forma válida.')).toBeInTheDocument();
  });

  test('muestra mensaje de error cuando ocurre una excepción en la fetch', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<KrokiViewer code="class User {" />);

    await act(async () => {
        vi.advanceTimersByTime(850);
        await Promise.resolve();
        await Promise.resolve();
    });

    expect(screen.getByText('Error de sintaxis: No se pudo renderizar el diagrama PlantUML de forma válida.')).toBeInTheDocument();
  });
});
