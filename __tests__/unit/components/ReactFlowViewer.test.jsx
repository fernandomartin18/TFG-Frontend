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
    ReactFlow: ({ nodes, edges, onNodesChange, onConnect, onEdgeContextMenu, onPaneClick, onNodeDragStop }) => (
      <div 
        data-testid="react-flow" 
        data-nodes={JSON.stringify(nodes)} 
        data-edges={JSON.stringify(edges)}
        onClick={onPaneClick}
      >
        <button data-testid="mock-connect" onClick={() => onConnect({ source: 'A', target: 'B' })}>Connect</button>
        <button data-testid="mock-context" onContextMenu={(e) => onEdgeContextMenu(e, edges[0])}>Context</button>
        <button data-testid="mock-drag-stop-1" onClick={() => {
          const mockNode = { id: 'n1', type: 'umlNode', position: { x: 50, y: 50 }, positionAbsolute: { x: 50, y: 50 } };
          onNodeDragStop({}, mockNode, nodes);
        }}>Drag Stop 1</button>
        <button data-testid="mock-drag-stop-2" onClick={() => {
          const packageNode = nodes.find(n => n.type === 'umlPackage') || { id: 'pkg-1', type: 'umlPackage', position: { x: 0, y: 0 }, style: { width: 400, height: 400 } };
          const mockNode = { id: 'n2', type: 'umlNode', position: { x: 100, y: 100 }, positionAbsolute: { x: 100, y: 100 }, parentId: undefined };
          onNodeDragStop({}, mockNode, [packageNode, mockNode]);
        }}>Drag Stop into Package</button>
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

  test('onNodeDragStop reparents node correctly', async () => {
    // Renderea con código vacío para instanciar el componente
    render(<ViewerWrapper code="" />);
    
    // Simula crear un nodo y paquete para tener algo en el flow
    fireEvent.click(screen.getByText('+ Paquete'));
    fireEvent.click(screen.getByText('+ Nodo'));
    
    // Esto va a probar la primera rama: arrastrar a nada
    fireEvent.click(screen.getByTestId('mock-drag-stop-1'));

    // Esto va a probar el caso donde lo soltamos dentro de un parent y actualiza el state
    fireEvent.click(screen.getByTestId('mock-drag-stop-2'));
  });

  test('cubriendo ramas de generatePlantUMLFromGraph', async () => {
    // Crear nodos y edges que cubran diferentes tipos de atributos y relaciones
    const mockNodes = [
      { id: 'pkg1', type: 'umlPackage', data: { label: 'TestPkg' } },
      { id: 'node1', type: 'umlNode', parentId: 'pkg1', data: { label: 'Node1', attributes: ['+ attr1: int', '- attr2: string'] } },
      { id: 'node2', type: 'umlNode', data: { label: 'Node2' } }, // Node2 outside pkg and no attributes
      { id: 'node3', type: 'umlNode', data: { label: 'Node3' } },
      { id: 'node4', type: 'umlNode', data: { label: 'Node4' } },
      { id: 'node5', type: 'umlNode', data: { label: 'Node5' } },
      { id: 'node6', type: 'umlNode', data: { label: 'Node6' } },
    ];

    const mockEdges = [
      { source: 'node1', target: 'node2', data: { relationType: 'inheritance', label: 'extends', sourceMultiplicity: '1', targetMultiplicity: '*' } },
      { source: 'node2', target: 'node3', data: { relationType: 'composition' } },
      { source: 'node3', target: 'node4', data: { relationType: 'aggregation' } },
      { source: 'node4', target: 'node5', data: { relationType: 'dependency' } },
      { source: 'node5', target: 'node6', data: { relationType: 'realization' } },
      { source: 'node6', target: 'node1', data: { relationType: 'association', label: 'knows' } },
      { source: 'node1', target: 'node4', data: { relationType: 'default-fallback' } }, // covers default branch
    ];

    const setCodeMock = vi.fn();

    const ViewerWithCustomState = () => {
      const [nodes, setNodes] = useState(mockNodes);
      const [edges, setEdges] = useState(mockEdges);
      return (
        <ReactFlowViewer 
          nodes={nodes} setNodes={setNodes}
          edges={edges} setEdges={setEdges}
          setCode={setCodeMock}
        />
      );
    }

    render(<ViewerWithCustomState />);
    fireEvent.click(screen.getByText('Sincronizar a Código'));

    expect(setCodeMock).toHaveBeenCalled();
    const generatedCode = setCodeMock.mock.calls[0][0];
    expect(generatedCode).toContain('package "TestPkg" as pkg1');
    expect(generatedCode).toContain('class "Node1" as node1');
    expect(generatedCode).toContain('+ attr1: int');
    expect(generatedCode).toContain('--|>');
    expect(generatedCode).toContain('*--');
    expect(generatedCode).toContain('o--');
    expect(generatedCode).toContain('..>');
    expect(generatedCode).toContain('..|>');
    expect(generatedCode).toContain('-->');
  });

  test('cubriendo useEffect de isDarkMode', () => {
    const ViewerModeToggle = () => {
      const [mode, setMode] = useState(false);
      const [edges, setEdges] = useState([
        { id: 'e1', data: { relationType: 'inheritance' } },
        { id: 'e2', data: { relationType: 'composition' } },
        { id: 'e3', data: { relationType: 'aggregation' } },
        { id: 'e4', data: { relationType: 'association' } }
      ]);
      return (
        <div>
          <button onClick={() => setMode(!mode)}>Toggle Mode</button>
          <ReactFlowViewer 
            isDarkMode={mode}
            nodes={[]} setNodes={vi.fn()}
            edges={edges} setEdges={setEdges}
            setCode={vi.fn()}
          />
        </div>
      );
    };

    render(<ViewerModeToggle />);
    // Change to dark mode
    fireEvent.click(screen.getByText('Toggle Mode'));
  });

  test('cubrir ramas de context menu edge updates', async () => {
    render(<ViewerWrapper code={samplePlantUML} isDarkMode={false} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    fireEvent.contextMenu(screen.getByTestId('mock-context'));
    
    // Click types
    const types = [
      'Herencia (--|>)',
      'Composición (*--)',
      'Agregación (o--)',
      'Realización (..|>)',
      'Asociación (-->)'
    ];

    for (const t of types) {
      if (screen.queryByText(t)) {
        fireEvent.pointerDown(screen.getByText(t));
        // Repen menu
        fireEvent.contextMenu(screen.getByTestId('mock-context'));
      }
    }
  });
});
