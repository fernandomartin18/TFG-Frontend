/* eslint-disable react/prop-types */
import React, { useCallback, useEffect, useState } from 'react';
import { ReactFlow, Background, Controls, addEdge, MarkerType } from '@xyflow/react';
import dagre from 'dagre';
import '@xyflow/react/dist/style.css';
import UmlNode from './UmlNode';
import UmlPackage from './UmlPackage';
import UmlEdge from './UmlEdge';

const nodeTypes = {
  umlNode: UmlNode,
  umlPackage: UmlPackage
};

const edgeTypes = {
  umlEdge: UmlEdge
};

let nodeId = 1;

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph({ compound: true });
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const nodeWidth = 172;
  const nodeHeight = 75;

  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    const isPkg = node.type === 'umlPackage';
    dagreGraph.setNode(node.id, { 
      width: isPkg ? 300 : nodeWidth, 
      height: isPkg ? 250 : Math.max(nodeHeight, (node.data?.attributes?.length || 0) * 20 + 50) 
    });
    if (node.parentId) {
      dagreGraph.setParent(node.id, node.parentId);
    }
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = direction === 'TB' ? 'top' : 'left';
    node.sourcePosition = direction === 'TB' ? 'bottom' : 'right';

    let absX = nodeWithPosition.x - nodeWithPosition.width / 2;
    let absY = nodeWithPosition.y - nodeWithPosition.height / 2;

    if (node.parentId) {
      const parentWithPos = dagreGraph.node(node.parentId);
      const parentAbsX = parentWithPos.x - parentWithPos.width / 2;
      const parentAbsY = parentWithPos.y - parentWithPos.height / 2;
      
      node.position = {
        x: absX - parentAbsX,
        y: absY - parentAbsY
      };
    } else {
      node.position = { x: absX, y: absY };
    }

    if (node.type === 'umlPackage') {
      node.style = { width: nodeWithPosition.width, height: nodeWithPosition.height };
    }

    return node;
  });

  return { nodes, edges };
};

const parsePlantUML = (code) => {
  const lines = code.split('\n');
  const parsedNodes = [];
  const parsedEdges = [];
  const nodeSet = new Set();
  const nodeMap = {}; 
  
  let edgeId = 0;
  let currentClass = null;
  let packageStack = [];

  lines.forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('@')) return;

    if (line === '}') {
      if (currentClass) {
        currentClass = null;
      } else if (packageStack.length > 0) {
        packageStack.pop();
      }
      return;
    }

    if (currentClass && line.match(/^[+-~#]/)) {
      const cleanlyAt = line.replace(/^[+-~#]\s*/, '');
      nodeMap[currentClass].data.attributes.push(cleanlyAt);
      return;
    }

    // Detectar packages
    const pkgMatch = line.match(/^(?:package|namespace|folder|frame|cloud|database)\s+"([^"]+)"(?:\s+as\s+(\w+))?(?:\s*\{)?/i) || 
                     line.match(/^(?:package|namespace|folder|frame|cloud|database)\s+(\w+)(?:\s*\{)?/i);
    if (pkgMatch && !line.includes('-->') && !line.includes('..>')) {
      const label = pkgMatch[1];
      const id = pkgMatch[2] || pkgMatch[1];
      const parentPackage = packageStack.length > 0 ? packageStack[packageStack.length - 1] : null;

      if (!nodeSet.has(id)) {
        nodeSet.add(id);
        const newPkg = {
          id: id,
          type: 'umlPackage',
          data: { label, id },
          style: { width: 350, height: 350 },
          position: { x: 0, y: 0 },
          ...(parentPackage ? { parentId: parentPackage } : {})
        };
        parsedNodes.push(newPkg);
        nodeMap[id] = newPkg;
      }
      if (line.endsWith('{')) {
        packageStack.push(id);
      }
      return;
    }

    // Detectar cajas/clases
    const nodeMatch = line.match(/^(?:class|rectangle|node|actor|database|interface)\s+"([^"]+)"(?:\s+as\s+(\w+))?(?:\s*\{)?/i) || 
                      line.match(/^(?:class|rectangle|node|actor|database|interface)\s+(\w+)(?:\s*\{)?/i);
    
    if (nodeMatch && !line.includes('-->') && !line.includes('..>')) {
      const label = nodeMatch[1];
      const id = nodeMatch[2] || nodeMatch[1];
      const currentPackage = packageStack.length > 0 ? packageStack[packageStack.length - 1] : null;

      if (!nodeSet.has(id)) {
        nodeSet.add(id);
        const newNode = {
          id: id,
          type: 'umlNode',
          data: { label, attributes: [], id },
          position: { x: 0, y: 0 },
          ...(currentPackage ? { parentId: currentPackage } : {})
        };
        parsedNodes.push(newNode);
        nodeMap[id] = newNode;
      }
      if (line.endsWith('{')) {
        currentClass = id;
      }
      return;
    }

    // Atributos simples sin bloque
    const attrMatch = line.match(/^(\w+)\s*:\s*(.+)$/);
    if (attrMatch && nodeSet.has(attrMatch[1])) {
      nodeMap[attrMatch[1]].data.attributes.push(attrMatch[2].trim());
      return;
    }

    // Detectar flechas (Soporte Multiplicidades y Strings con espacios)
    // Ej: App "1" --> "1" MainForm : contains
    const edgeMatch = line.match(/^(?:"([^"]+)"|([\w]+))(?:\s+"([^"]+)")?\s+([.-]+[|>*]*)\s+(?:"([^"]+)"\s+)?(?:"([^"]+)"|([\w]+))(?:\s*:\s*(.*))?/);
    if (edgeMatch && (line.includes('-->') || line.includes('..>') || line.includes('--|>') || line.includes('-') || line.includes('.'))) {
      const source = edgeMatch[1] || edgeMatch[2];
      const sourceMultiplicity = edgeMatch[3] || '';
      const edgeStyle = edgeMatch[4];
      const targetMultiplicity = edgeMatch[5] || '';
      const target = edgeMatch[6] || edgeMatch[7];
      const label = edgeMatch[8] || '';
      
      [source, target].forEach(nId => {
        if (!nodeSet.has(nId)) {
          nodeSet.add(nId);
          const currentPackage = packageStack.length > 0 ? packageStack[packageStack.length - 1] : null;
          const newNode = { 
            id: nId, type: 'umlNode', data: { label: nId, attributes: [], id: nId }, position: { x: 0, y: 0 },
            ...(currentPackage ? { parentId: currentPackage } : {})
          };
          parsedNodes.push(newNode);
          nodeMap[nId] = newNode;
        }
      });

      parsedEdges.push({
        id: `e${edgeId++}-${source}-${target}`,
        source,
        target,
        type: 'umlEdge',
        data: { label, sourceMultiplicity, targetMultiplicity },
        markerEnd: { type: MarkerType.ArrowClosed }
      });
    }
  });

  return getLayoutedElements(parsedNodes, parsedEdges);
};

function ReactFlowViewer({ isDarkMode, nodes, setNodes, onNodesChange, edges, setEdges, onEdgesChange, setCode, setActiveTab, code }) {

  const [edgeMenu, setEdgeMenu] = useState(null);

  useEffect(() => {
    if (nodes.length <= 1 && nodes[0]?.data.label === 'Inicio') {
        if (code && code.trim().length > 15) { 
        // Parse whenever the code changes actively and we need to reset
        const { nodes: layoutedNodes, edges: layoutedEdges } = parsePlantUML(code);
        if (layoutedNodes.length > 0) {
            setNodes([...layoutedNodes]);
            setEdges([...layoutedEdges]);
        }
        }
    }
  }, []);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, type: 'umlEdge', data: { label: '', sourceMultiplicity: '', targetMultiplicity: '' }, markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
    [setEdges]
  );

  const onEdgesDelete = useCallback(
    (edgesToDelete) => setEdges((eds) => eds.filter((e) => !edgesToDelete.includes(e))),
    [setEdges]
  );

  const onEdgeContextMenu = useCallback(
    (event, edge) => {
      event.preventDefault();
      setEdgeMenu({
        id: edge.id,
        top: event.clientY,
        left: event.clientX,
      });
    },
    []
  );

  const onPaneClick = useCallback(() => setEdgeMenu(null), []);
  const onEdgeDelete = useCallback((id) => {
    setEdges((eds) => eds.filter(e => e.id !== id));
    setEdgeMenu(null);
  }, [setEdges]);

  const getSafePosition = (nds) => {
    if (!nds || nds.length === 0) return { x: 50, y: 50 };
    
    let maxX = -Infinity;
    let targetY = 50;

    nds.forEach(n => {
      // Ignorar nodos hijos para basarnos en la caja contenedora de más alto nivel para calcular límites
      if (n.parentId) return;
      
      const absX = n.positionAbsolute ? n.positionAbsolute.x : n.position.x;
      const absY = n.positionAbsolute ? n.positionAbsolute.y : n.position.y;
      const width = n.style?.width || (n.type === 'umlPackage' ? 350 : 170);
      
      const rightEdge = absX + width;
      if (rightEdge > maxX) {
        maxX = rightEdge;
        targetY = absY;
      }
    });

    return { x: maxX === -Infinity ? 50 : maxX + 40, y: targetY };
  };

  const addNode = () => {
    const newNode = {
      id: `node-${nodeId++}`,
      type: 'umlNode',
      position: getSafePosition(nodes),
      data: { 
        label: `Nodo ${nodeId}`, 
        attributes: []
      }
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const addPackage = () => {
    const newPkg = {
      id: `pkg-${nodeId++}`,
      type: 'umlPackage',
      position: getSafePosition(nodes),
      data: { label: `Paquete ${nodeId}` },
      style: { width: 350, height: 350 }
    };
    setNodes((nds) => [...nds, newPkg]);
  };

const generatePlantUMLFromGraph = () => {
    let newCode = '@startuml\n\n';
    
    // Recursive function to render packages and their contents
    const renderNode = (node, indentLevel) => {
      let code = '';
      const indent = '  '.repeat(indentLevel);
      const cleanId = node.id.replace(/-/g, '');
      
      if (node.type === 'umlPackage') {
        code += `${indent}package "${node.data.label}" as ${cleanId} {\n`;
        const children = nodes.filter(n => n.parentId === node.id);
        children.forEach(child => {
          code += renderNode(child, indentLevel + 1);
        });
        code += `${indent}}\n\n`;
      } else {
        if (node.data.attributes && node.data.attributes.length > 0) {
          code += `${indent}class "${node.data.label}" as ${cleanId} {\n`;
          node.data.attributes.forEach(attr => code += `${indent}  ${attr}\n`);
          code += `${indent}}\n`;
        } else {
          code += `${indent}class "${node.data.label}" as ${cleanId}\n`;
        }
      }
      return code;
    };

    // Find top-level nodes (nodes without parentId)
    const topLevelNodes = nodes.filter(n => !n.parentId);
    
    topLevelNodes.forEach(node => {
      newCode += renderNode(node, 0);
    });
    
    newCode += '\n';

    edges.forEach(edge => {
      let lStr = '';
      const lbl = edge.data?.label || edge.label;
      if (lbl) lStr = ` : ${lbl}`;
      
      const sMult = edge.data?.sourceMultiplicity ? ` "${edge.data.sourceMultiplicity}" ` : ' ';
      const tMult = edge.data?.targetMultiplicity ? ` "${edge.data.targetMultiplicity}" ` : ' ';

      newCode += `${edge.source.replace(/-/g, '')}${sMult}-->${tMult}${edge.target.replace(/-/g, '')}${lStr}\n`;
    });
    
    newCode += '\n@enduml';
    setCode(newCode);
    setActiveTab('kroki');
  };

  const onNodeDragStop = (event, node, nodes) => {
    if (node.type === 'umlNode' || node.type === 'umlPackage') {
      const absX = node.positionAbsolute ? node.positionAbsolute.x : node.position.x;
      const absY = node.positionAbsolute ? node.positionAbsolute.y : node.position.y;

      const pkgs = nodes.filter(n => n.type === 'umlPackage' && n.id !== node.id &&
        absX > n.position.x && absX < n.position.x + (n.style?.width || 350) &&
        absY > n.position.y && absY < n.position.y + (n.style?.height || 350)
      );

      pkgs.sort((a, b) => {
        const areaA = (a.style?.width || 350) * (a.style?.height || 350);
        const areaB = (b.style?.width || 350) * (b.style?.height || 350);
        return areaA - areaB;
      });

      const pkg = pkgs.length > 0 ? pkgs[0] : null;
      
      if (pkg && node.parentId !== pkg.id) {
        setNodes(nds => nds.map(n => {
          if (n.id === node.id) {
            return {
              ...n,
              parentId: pkg.id,
              position: { x: absX - pkg.position.x, y: absY - pkg.position.y }
            };
          }
          return n;
        }));
      } else if (!pkg && node.parentId) {
          // Si lo sacan de cualquier paquete, quitamos el parentId
          setNodes(nds => nds.map(n => {
            if (n.id === node.id) {
                return {
                    ...n,
                    parentId: undefined,
                    position: { x: absX, y: absY }
                }
            }
            return n;
          }));
      }
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div className="react-flow-panel">
        <button className="react-flow-btn" onClick={addNode}>+ Nodo</button>
        <button className="react-flow-btn" onClick={addPackage}>+ Paquete</button>
        <button className="react-flow-btn-sync" onClick={generatePlantUMLFromGraph}>
          Sincronizar a Código
        </button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onEdgesDelete={onEdgesDelete}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneClick={onPaneClick}
        onConnect={onConnect}
        onNodeDragStop={(e, node) => onNodeDragStop(e, node, nodes)}
        fitView
        colorMode={isDarkMode ? 'dark' : 'light'}
      >
        <Background variant="dots" gap={12} size={1} />
        <Controls />
      </ReactFlow>

      {edgeMenu && (
        <div 
          style={{
            position: 'fixed',
            top: edgeMenu.top,
            left: edgeMenu.left,
            zIndex: 9999,
            background: isDarkMode ? '#2d2d2d' : '#f0f0f0',
            border: '1px solid #999',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            padding: '4px',
            minWidth: '120px'
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              onEdgeDelete(edgeMenu.id);
            }}
            style={{
              background: 'transparent',
              color: '#ff4444',
              border: 'none',
              padding: '6px 12px',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              fontSize: '13px',
              fontWeight: '500',
              borderRadius: '4px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 68, 68, 0.1)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            Eliminar relación
          </button>
        </div>
      )}
    </div>
  );
}

export default ReactFlowViewer;