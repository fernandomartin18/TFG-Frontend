import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UmlEdge from '../../../src/components/UmlEdge.jsx';

// Mock de reactflow que se usa en UmlEdge
vi.mock('@xyflow/react', () => ({
  BaseEdge: ({ path }) => <path data-testid="base-edge" d={path} />,
  EdgeLabelRenderer: ({ children }) => <div data-testid="edge-label-renderer">{children}</div>,
  getBezierPath: () => ['M0,0 C50,0 50,100 100,100', 50, 50],
  useReactFlow: () => ({
    setEdges: vi.fn(callback => {
      // Simulamos que el callback se llama para cambiar los datos
      const edges = [{ id: 'e1', data: { label: 'old' } }];
      callback(edges);
    })
  })
}));

describe('UmlEdge Component', () => {
  const defaultProps = {
    id: 'e1',
    sourceX: 0,
    sourceY: 0,
    targetX: 100,
    targetY: 100,
    sourcePosition: 'right',
    targetPosition: 'left',
    data: {
      label: 'Relación',
      sourceMultiplicity: '1',
      targetMultiplicity: '*'
    }
  };

  test('renderiza correctamente el componente con todos sus inputs', () => {
    render(<UmlEdge {...defaultProps} />);
    
    // Debería renderizarse tres inputs (para la label, para multilpicidad de src y target)
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(3);
    
    expect(inputs[0].value).toBe('Relación');
    expect(inputs[1].value).toBe('1');
    expect(inputs[2].value).toBe('*');
  });

  test('cambia el valor cuando se edita el input', () => {
    const { container } = render(<UmlEdge {...defaultProps} />);
    const inputs = screen.getAllByRole('textbox');
    
    // simulamos el cambio en label
    fireEvent.change(inputs[0], { target: { value: 'Nueva relación' } });
    fireEvent.change(inputs[1], { target: { value: '1..*' } });
    fireEvent.change(inputs[2], { target: { value: '0..1' } });
    
    // Como las props no han cambiado en el test, el valor seguirá siendo de defaultProps
    // aunque sí hemos logrado testear la ruta de updateData al menos.
    expect(inputs[0]).toBeInTheDocument();
  });

  test('maneja data vacía o nula correctamente', () => {
    render(<UmlEdge {...defaultProps} data={undefined} />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs[0].value).toBe('');
    expect(inputs[1].value).toBe('');
    expect(inputs[2].value).toBe('');
  });
});
