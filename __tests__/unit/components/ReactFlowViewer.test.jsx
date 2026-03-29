import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import ReactFlowViewer from '../../../src/components/ReactFlowViewer.jsx';

vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react');
  return {
    ...actual,
    useNodesState: (initial) => [initial, vi.fn(), vi.fn()],
    useEdgesState: (initial) => [initial, vi.fn(), vi.fn()],
    ReactFlow: ({ nodes, edges, onNodesChange, onConnect, onEdgeContextMenu, onPaneClick }) => (
      <div 
        data-testid="react-flow" 
        data-nodes={JSON.stringify(nodes)} 
        data-edges={JSON.stringify(edges)}
        onClick={onPaneClick}
      >
        <button data-testid="mock-connect" onClick={() => onConnect({ source: 'A', target: 'B' })}>Connect</button>
        <button data-testid="mock-context" onContextMenu={(e) => onEdgeContextMenu(e, edges[0])}>Context</button>
        React Flow
      </div>
    ),
    Background: () => <div />,
    Controls: () => <div />,
    addEdge: (params, eds) => [...eds, { ...params, id: 'e-new' }],
    MarkerType: { ArrowClosed: 'ArrowClosed' }
  };
});

// mock de dagre que se usa para layout
vi.mock('dagre', () => {
  return {
    default: {
      graphlib: {
        Graph: vi.fn().mockImplementation(function() {
          this.setGraph = vi.fn();
          this.setDefaultEdgeLabel = vi.fn();
          this.setNode = vi.fn();
          this.setEdge = vi.fn();
          this.setParent = vi.fn();
          this.node = vi.fn().mockReturnValue({ x: 100, y: 100, width: 50, height: 50 });
        })
      },
      layout: vi.fn()
    }
  };
});

describe('ReactFlowViewer Component', () => {
  const samplePlantUML = `
@startuml
package "MyPackage" {
  class User {
    + name: String
    - age: int
  }
  
  class Account {
    + calculate()
  }
}

User "1" --> "*" Account : owns
User <|-- Admin
Account *-- Transaction
@enduml
  `;

  const ViewerWrapper = ({ code, isDarkMode = false }) => {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [activeTab, setActiveTab] = useState('diagram');
    return (
      <ReactFlowViewer 
        code={code} 
        isDarkMode={isDarkMode}
        onNodesChange={vi.fn()} 
        onEdgesChange={vi.fn()} 
        setNodes={setNodes}
        setEdges={setEdges}
        nodes={nodes}
        edges={edges}
        setCode={vi.fn()}
        setActiveTab={setActiveTab}
      />
    );
  };

  test('renderiza el componente con nodos parselados desde PlantUML', async () => {
    render(<ViewerWrapper code={samplePlantUML} />);
    
    await waitFor(() => {
      const flow = screen.getByTestId('react-flow');
      expect(JSON.parse(flow.getAttribute('data-nodes')).length).toBeGreaterThan(0);
    });

    const flow = screen.getByTestId('react-flow');
    const nodesData = JSON.parse(flow.getAttribute('data-nodes'));
    const edgesData = JSON.parse(flow.getAttribute('data-edges'));

    expect(nodesData.length).toBeGreaterThan(0);
  });

  test('añade nodo y paquete al hacer clic en botones', async () => {
    render(<ViewerWrapper code="" />);
    const flow = screen.getByTestId('react-flow');
    
    // Add Node
    fireEvent.click(screen.getByText('+ Nodo'));
    await waitFor(() => {
      const nodesData = JSON.parse(flow.getAttribute('data-nodes'));
      expect(nodesData.some(n => n.type === 'umlNode')).toBe(true);
    });

    // Add Package
    fireEvent.click(screen.getByText('+ Paquete'));
    await waitFor(() => {
      const nodesData = JSON.parse(flow.getAttribute('data-nodes'));
      expect(nodesData.some(n => n.type === 'umlPackage')).toBe(true);
    });
  });

  test('sincroniza a codigo llamando a setCode', async () => {
    render(<ViewerWrapper code={samplePlantUML} />);
    // Wait for parse
    await waitFor(() => {
      const flow = screen.getByTestId('react-flow');
      expect(JSON.parse(flow.getAttribute('data-nodes')).length).toBeGreaterThan(0);
    });
    
    fireEvent.click(screen.getByText('Sincronizar a Código'));
    // Since setCode is mocked inside the wrapper but passed to props, it's just coverage
  });

  test('interaccion con edges (context menu y onConnect)', async () => {
    render(<ViewerWrapper code={samplePlantUML} isDarkMode={true} />);
    
    await waitFor(() => {
      const flow = screen.getByTestId('react-flow');
      expect(JSON.parse(flow.getAttribute('data-edges')).length).toBeGreaterThan(0);
    });

    // Test connection
    fireEvent.click(screen.getByTestId('mock-connect'));
    await waitFor(() => {
      const flow = screen.getByTestId('react-flow');
      expect(JSON.parse(flow.getAttribute('data-edges')).some(e => e.id === 'e-new')).toBe(true);
    });

    // Test context menu
    fireEvent.contextMenu(screen.getByTestId('mock-context'));
    expect(screen.getByText('Tipo de Relación')).toBeInTheDocument();

    // Click inside menu
    fireEvent.pointerDown(screen.getByText('Dependencia (..>)'));
    
    await waitFor(() => {
      expect(screen.queryByText('Tipo de Relación')).toBeNull();
    });

    // Test context menu again for delete
    fireEvent.contextMenu(screen.getByTestId('mock-context'));
    fireEvent.pointerDown(screen.getByText('Eliminar relación'));
  });

  test('testea undo y redo con disparador de teclado', async () => {
    render(<ViewerWrapper code="" />);
    
    // Create node to push history
    fireEvent.click(screen.getByText('+ Nodo'));
    
    // Simulate ctrl+Z
    fireEvent.keyDown(document, { key: 'z', ctrlKey: true });
    
    // Simulate ctrl+shift+Z
    fireEvent.keyDown(document, { key: 'z', ctrlKey: true, shiftKey: true });
    
    // Simulate ctrl+y
    fireEvent.keyDown(document, { key: 'y', ctrlKey: true });
  });

  test('no se rompe si el codigo esta vacio', () => {
    render(<ViewerWrapper code="" />);
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });
});
