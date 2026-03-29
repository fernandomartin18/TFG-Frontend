import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UmlPackage from '../../../src/components/UmlPackage.jsx';

vi.mock('@xyflow/react', () => ({
  NodeResizer: () => <div data-testid="node-resizer" />,
  useReactFlow: () => ({
    setNodes: vi.fn(callback => {
      const nodes = [{ id: 'p1', data: { label: 'Old' } }, { id: 'p2', parentId: 'p1', data: {} }];
      callback(nodes);
    }),
    setEdges: vi.fn(callback => {
      const edges = [{ id: 'e1', source: 'p1', target: 'n1' }];
      callback(edges);
    })
  })
}));

describe('UmlPackage Component', () => {
  const defaultProps = {
    id: 'p1',
    data: {
      label: 'MyPackage'
    },
    selected: true
  };

  test('renderiza correctamente el paquete', () => {
    render(<UmlPackage {...defaultProps} />);
    
    // Verificar que aparece el resizer (por estar selected) y el input
    expect(screen.getByTestId('node-resizer')).toBeInTheDocument();
    
    const input = screen.getByDisplayValue('MyPackage');
    expect(input).toBeInTheDocument();
  });

  test('permite actualizar el nombre del paquete', () => {
    render(<UmlPackage {...defaultProps} />);
    const input = screen.getByDisplayValue('MyPackage');
    
    fireEvent.change(input, { target: { value: 'NewPackageName' } });
    // Al simular el cambio, se llama al mock setNodes
  });

  test('permite eliminar el paquete', () => {
    render(<UmlPackage {...defaultProps} />);
    const deleteBtn = screen.getByText('✕');
    fireEvent.click(deleteBtn);
    // Llama a setNodes y setEdges
  });
});
