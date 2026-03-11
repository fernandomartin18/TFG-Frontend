import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReactFlowViewer from '../../../src/components/ReactFlowViewer';

// Mock dependencies
vi.mock('@xyflow/react', () => ({
  ReactFlow: ({ children }) => <div data-testid="react-flow">{children}</div>,
  Background: () => <div data-testid="rf-background" />,
  Controls: () => <div data-testid="rf-controls" />,
  MarkerType: { ArrowClosed: 'arrowclosed' },
  addEdge: vi.fn(),
  useNodesState: (initial) => [initial, vi.fn(), vi.fn()],
  useEdgesState: (initial) => [initial, vi.fn(), vi.fn()]
}));

vi.mock('../../../src/components/UmlNode', () => ({
  default: () => <div data-testid="uml-node">UmlNode</div>
}));

vi.mock('../../../src/components/UmlPackage', () => ({
  default: () => <div data-testid="uml-package">UmlPackage</div>
}));

vi.mock('../../../src/components/UmlEdge', () => ({
  default: () => <div data-testid="uml-edge">UmlEdge</div>
}));

describe('ReactFlowViewer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProps = {
    nodes: [{ id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } }],
    edges: [],
    onNodesChange: vi.fn(),
    onEdgesChange: vi.fn(),
    onConnect: vi.fn(),
    setNodes: vi.fn(),
    setEdges: vi.fn()
  };

  it('renders correctly', () => {
    render(<ReactFlowViewer {...mockProps} />);
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });
});
