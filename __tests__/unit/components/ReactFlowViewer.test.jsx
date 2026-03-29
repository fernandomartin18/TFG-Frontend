import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import ReactFlowViewer from '../../../src/components/ReactFlowViewer.jsx';

vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react');
  return {
    ...actual,
    useNodesState: (initial) => [initial, vi.fn(), vi.fn()],
    useEdgesState: (initial) => [initial, vi.fn(), vi.fn()],
    ReactFlow: ({ nodes, edges }) => (
      <div data-testid="react-flow" data-nodes={JSON.stringify(nodes)} data-edges={JSON.stringify(edges)}>
        React Flow
      </div>
    ),
    Background: () => <div />,
    Controls: () => <div />,
    addEdge: vi.fn(),
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

  const ViewerWrapper = ({ code }) => {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    return (
      <ReactFlowViewer 
        code={code} 
        onNodesChange={() => {}} 
        onEdgesChange={() => {}} 
        setNodes={setNodes}
        setEdges={setEdges}
        nodes={nodes}
        edges={edges}
      />
    );
  };

  test('renderiza el componente con nodos parselados desde PlantUML', async () => {
    render(<ViewerWrapper code={samplePlantUML} />);
    
    // El componente usa useEffect para setear nodos
    await waitFor(() => {
      const flow = screen.getByTestId('react-flow');
      expect(JSON.parse(flow.getAttribute('data-nodes')).length).toBeGreaterThan(0);
    });

    const flow = screen.getByTestId('react-flow');
    const nodesData = JSON.parse(flow.getAttribute('data-nodes'));
    const edgesData = JSON.parse(flow.getAttribute('data-edges'));

    expect(nodesData.length).toBeGreaterThan(0);
    const userNode = nodesData.find(n => n.id === 'User');
    expect(userNode).toBeDefined();
    expect(userNode.data.attributes.length).toBe(2);

    expect(edgesData.length).toBe(3);
  });

  test('no se rompe si el codigo esta vacio', () => {
    render(<ViewerWrapper code="" />);
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });
});
