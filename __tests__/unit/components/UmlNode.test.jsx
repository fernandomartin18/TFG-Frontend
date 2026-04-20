import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UmlNode from '../../../src/components/UmlNode.jsx';

vi.mock('@xyflow/react', () => ({
  Handle: () => <div data-testid="handle" />,
  Position: { Top: 'top', Bottom: 'bottom' },
  useReactFlow: () => ({
    setNodes: vi.fn(callback => {
      // Simulate state update
      const nodes = [{ id: 'n1', data: { label: 'Old', attributes: ['attr1'] } }];
      callback(nodes);
    }),
    setEdges: vi.fn()
  })
}));

describe('UmlNode Component', () => {
  const defaultProps = {
    id: 'n1',
    data: {
      label: 'ClassA',
      attributes: ['+ name: string']
    }
  };

  test('renderiza el nodo correctamente con su título y atributos', () => {
    render(<UmlNode {...defaultProps} />);
    
    // El título es un input
    const titleInput = screen.getByDisplayValue('ClassA');
    expect(titleInput).toBeInTheDocument();
    
    // El atributo es un input
    const attrInput = screen.getByDisplayValue('+ name: string');
    expect(attrInput).toBeInTheDocument();
  });

  test('permite cambiar el título de la clase', () => {
    render(<UmlNode {...defaultProps} />);
    const titleInput = screen.getByDisplayValue('ClassA');
    
    fireEvent.change(titleInput, { target: { value: 'ClassB' } });
    expect(titleInput).toBeInTheDocument(); // se asegura que no crashea
  });

  test('permite cambiar un atributo', () => {
    render(<UmlNode {...defaultProps} />);
    const attrInput = screen.getByDisplayValue('+ name: string');
    
    fireEvent.change(attrInput, { target: { value: '- age: int' } });
    // Probar el onFocus/onBlur inline styles
    fireEvent.focus(attrInput);
    expect(attrInput.style.border).toBe('1px solid rgb(85, 85, 85)');
    fireEvent.blur(attrInput);
    expect(attrInput.style.border).toBe('1px solid transparent');
  });

  test('permite borrar el nodo', () => {
    render(<UmlNode {...defaultProps} />);
    const deleteBtn = screen.getByText('✕');
    fireEvent.click(deleteBtn);
  });

  test('permite borrar un atributo', () => {
    render(<UmlNode {...defaultProps} />);
    const deleteAttrBtn = screen.getByTitle('Borrar atributo');
    fireEvent.click(deleteAttrBtn);
  });

  test('permite añadir un nuevo atributo', () => {
    render(<UmlNode {...defaultProps} />);
    
    const newAttrInput = screen.getByPlaceholderText('+ nuevo atributo');
    fireEvent.change(newAttrInput, { target: { value: 'newAttr: var' } });
    
    // enviar el form
    fireEvent.submit(newAttrInput.closest('form'));
    
    // Si metemos uno vacio no hace nada
    fireEvent.change(newAttrInput, { target: { value: '   ' } });
    fireEvent.submit(newAttrInput.closest('form'));
  });

  test('renderiza nodo sin atributos inicialmente evitando crasheos', () => {
    render(<UmlNode id="n2" data={{ label: 'EmptyNode' }} />);
    expect(screen.getByDisplayValue('EmptyNode')).toBeInTheDocument();
  });
});
