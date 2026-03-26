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

const parsePlantUML = (code, isDarkMode = false) => {
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

    if (currentClass) {
      nodeMap[currentClass].data.attributes.push(line);
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
    const edgeMatch = line.match(/^(?:"([^"]+)"|([\w]+))(?:\s+"([^"]+)")?\s+([<o*|]*[.-]+[|>o*]*)\s+(?:"([^"]+)"\s+)?(?:"([^"]+)"|([\w]+))(?:\s*:\s*(.*))?/);
    if (edgeMatch && (line.includes('-') || line.includes('.'))) {
      const rawSource = edgeMatch[1] || edgeMatch[2];
      const rawSourceMultiplicity = edgeMatch[3] || '';
      const edgeStyle = edgeMatch[4];
      const rawTargetMultiplicity = edgeMatch[5] || '';
      const rawTarget = edgeMatch[6] || edgeMatch[7];
      const label = edgeMatch[8] || '';

      const isReverse = edgeStyle.startsWith('<') || edgeStyle.endsWith('o') || edgeStyle.endsWith('*');

      const source = isReverse ? rawTarget : rawSource;
      const target = isReverse ? rawSource : rawTarget;
      const sourceMultiplicity = isReverse ? rawTargetMultiplicity : rawSourceMultiplicity;
      const targetMultiplicity = isReverse ? rawSourceMultiplicity : rawTargetMultiplicity;
      
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

      let relationType = 'association';
      if (edgeStyle.includes('.')) {
        if (edgeStyle.includes('|')) relationType = 'realization';
        else relationType = 'dependency';
      } else {
        if (edgeStyle.includes('|')) relationType = 'inheritance';
        else if (edgeStyle.includes('*')) relationType = 'composition';
        else if (edgeStyle.includes('o')) relationType = 'aggregation';
        else relationType = 'association';
      }

      const newMarkerEndType = (relationType === 'inheritance' || relationType === 'realization') ? `inheritance-end-${isDarkMode ? 'dark' : 'light'}` : 
                           (relationType !== 'composition' && relationType !== 'aggregation' ? { type: MarkerType.ArrowClosed } : undefined);
      
      const newMarkerStart = relationType === 'composition' ? `composition-start-${isDarkMode ? 'dark' : 'light'}` :
                             relationType === 'aggregation' ? `aggregation-start-${isDarkMode ? 'dark' : 'light'}` : undefined;

      parsedEdges.push({
        id: `e${edgeId++}-${source}-${target}`,
        source,
        target,
        type: 'umlEdge',
        data: { label, sourceMultiplicity, targetMultiplicity, relationType },
        style: (relationType === 'dependency' || relationType === 'realization') ? { strokeDasharray: '5 5' } : {},
        markerEnd: newMarkerEndType,
        markerStart: newMarkerStart
      });
    }
  });

  return getLayoutedElements(parsedNodes, parsedEdges);
};

function ReactFlowViewer({ isDarkMode, nodes, setNodes, onNodesChange, edges, setEdges, onEdgesChange, setCode, setActiveTab, code }) {

  const [edgeMenu, setEdgeMenu] = useState(null);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const isUndoRedoAction = React.useRef(false);

  // Actualizar marcadores si cambia el tema oscuro/claro
  useEffect(() => {
    setEdges(eds => eds.map(edge => {
      const relType = edge.data?.relationType;
      if (!relType || relType === 'association' || relType === 'dependency') return edge;

      const newMarkerEndObj = (relType === 'inheritance' || relType === 'realization') ? `inheritance-end-${isDarkMode ? 'dark' : 'light'}` : undefined;
      const newMarkerStart = relType === 'composition' ? `composition-start-${isDarkMode ? 'dark' : 'light'}` :
                             relType === 'aggregation' ? `aggregation-start-${isDarkMode ? 'dark' : 'light'}` : undefined;
      
      return {
        ...edge,
        markerEnd: newMarkerEndObj || edge.markerEnd,
        markerStart: newMarkerStart || edge.markerStart
      };
    }));
  }, [isDarkMode, setEdges]);

  // Auto-snapshot con debounce para capturar TODOS los cambios (arrastrar, editar desde dentro de los nodos, etc.)
  useEffect(() => {
    if (isUndoRedoAction.current) {
      const timer = setTimeout(() => { isUndoRedoAction.current = false; }, 300);
      return () => clearTimeout(timer);
    }

    const timeout = setTimeout(() => {
      setPast((p) => {
        const pLast = p.length > 0 ? p[p.length - 1] : null;
        const currentNodesStr = JSON.stringify(nodes);
        const currentEdgesStr = JSON.stringify(edges);
        
        if (pLast && JSON.stringify(pLast.nodes) === currentNodesStr && JSON.stringify(pLast.edges) === currentEdgesStr) {
          return p;
        }
        
        setFuture([]); // Si hay un cambio nuevo manual, el futuro se borra (no se puede rehacer)
        return [...p, { nodes: JSON.parse(currentNodesStr), edges: JSON.parse(currentEdgesStr) }];
      });
    }, 400); // 400ms tras el final de mover el nodo o escribir
    
    return () => clearTimeout(timeout);
  }, [nodes, edges]);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length <= 1) return p;
      
      const current = p[p.length - 1]; 
      const prev = p[p.length - 2];   
      const newPast = p.slice(0, p.length - 1);
      
      isUndoRedoAction.current = true;
      setFuture((f) => [current, ...f]);
      setNodes(prev.nodes);
      setEdges(prev.edges);
      
      return newPast;
    });
  }, [setNodes, setEdges]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      const newFuture = f.slice(1);
      
      isUndoRedoAction.current = true;
      setPast((p) => [...p, next]);
      setNodes(next.nodes);
      setEdges(next.edges);
      
      return newFuture;
    });
  }, [setNodes, setEdges]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ignorar si estamos escribiendo en un input o textarea
      if (['INPUT', 'TEXTAREA'].includes(event.target.tagName)) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;
      
      if (cmdOrCtrl && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        event.stopPropagation();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (cmdOrCtrl && event.key.toLowerCase() === 'y' && !isMac) {
        event.preventDefault();
        event.stopPropagation();
        redo();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  useEffect(() => {
    if (nodes.length <= 1) {
        if (code && code.trim().length > 15) { 
        // Parse whenever the code changes actively and we need to reset
        const { nodes: layoutedNodes, edges: layoutedEdges } = parsePlantUML(code, isDarkMode);
        if (layoutedNodes.length > 0) {
            setNodes([...layoutedNodes]);
            setEdges([...layoutedEdges]);
        }
        }
    }
  }, []);

  const onConnect = useCallback(
      (params) => {
        setEdges((eds) => addEdge({ ...params, type: 'umlEdge', data: { label: '', sourceMultiplicity: '', targetMultiplicity: '', relationType: 'association' }, markerEnd: { type: MarkerType.ArrowClosed } }, eds));
      },
      [setEdges]
    );

    const onEdgesDelete = useCallback(
      (edgesToDelete) => {
        setEdges((eds) => eds.filter((e) => !edgesToDelete.includes(e)));
      },
      [setEdges]
    );

    const onNodesDelete = useCallback(
      (nodesToDelete) => {
        // No se necesita lógica aquí el debounce captura el estado posterior
      },
      []
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
        // Encontrar el siguiente ID disponible buscando en los nodos actuales
        let nextId = 1;
        while (nodes.some(n => n.id === `node-${nextId}`)) {
          nextId++;
        }
        
        const newNode = {
          id: `node-${nextId}`,
          type: 'umlNode',
          position: getSafePosition(nodes),
          data: { 
            label: `Nodo ${nextId}`, 
            attributes: []
          }
        };
        setNodes((nds) => [...nds, newNode]);
      };

      const addPackage = () => {
          // Encontrar el siguiente ID disponible buscando en los paquetes actuales
          let nextId = 1;
          while (nodes.some(n => n.id === `pkg-${nextId}`)) {
            nextId++;
          }

          const newPkg = {
            id: `pkg-${nextId}`,
            type: 'umlPackage',
            position: getSafePosition(nodes),
            data: { label: `Paquete ${nextId}` },
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
      const cleanId = node.id.replaceAll(/[^a-zA-Z0-9_]/g, '');
      
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

      let pArrow = '-->';
      switch (edge.data?.relationType) {
        case 'inheritance': pArrow = '--|>'; break;
        case 'composition': pArrow = '*--'; break;
        case 'aggregation': pArrow = 'o--'; break;
        case 'dependency': pArrow = '..>'; break;
        case 'realization': pArrow = '..|>'; break;
        case 'association':
        default: pArrow = '-->'; break;
      }

      newCode += `${edge.source.replaceAll(/[^a-zA-Z0-9_]/g, '')}${sMult}${pArrow}${tMult}${edge.target.replaceAll(/[^a-zA-Z0-9_]/g, '')}${lStr}\n`;
    });
    
    newCode += '\n@enduml';
    setCode(newCode);
  };

const onNodeDragStop = (event, node, nodes) => {
    if (node.type === 'umlNode' || node.type === 'umlPackage') {
      // Función auxiliar para obtener la posición absoluta de un nodo sumando las coordenadas de sus padres
      const getAbsNodePos = (n) => {
        let x = n.position.x;
        let y = n.position.y;
        let currId = n.parentId;
        while (currId) {
          const p = nodes.find(parent => parent.id === currId);
          if (p) {
            x += p.position.x;
            y += p.position.y;
            currId = p.parentId;
          } else {
            currId = null;
          }
        }
        return { x, y };
      };

      const absX = node.positionAbsolute ? node.positionAbsolute.x : getAbsNodePos(node).x;
      const absY = node.positionAbsolute ? node.positionAbsolute.y : getAbsNodePos(node).y;

      const nodeWidth = node.style?.width || (node.type === 'umlPackage' ? 350 : 160);
      const nodeHeight = node.style?.height || (node.type === 'umlPackage' ? 350 : 100);
      
      const centerX = absX + nodeWidth / 2;
      const centerY = absY + nodeHeight / 2;

      const pkgs = nodes.filter(n => {
        if (n.type !== 'umlPackage' || n.id === node.id) return false;
        
        // Evitar anidaciones cíclicas (padre metido dentro de su hijo)
        let isDescendant = false;
        let currId = n.parentId;
        while (currId) {
          if (currId === node.id) { isDescendant = true; break; }
          const p = nodes.find(parent => parent.id === currId);
          currId = p ? p.parentId : null;
        }
        if (isDescendant) return false;

        const pkgAbs = getAbsNodePos(n);
        const w = n.style?.width || 350;
        const h = n.style?.height || 350;

        return centerX > pkgAbs.x && centerX < pkgAbs.x + w &&
               centerY > pkgAbs.y && centerY < pkgAbs.y + h;
      });

      pkgs.sort((a, b) => {
        const areaA = (a.style?.width || 350) * (a.style?.height || 350);
        const areaB = (b.style?.width || 350) * (b.style?.height || 350);
        return areaA - areaB;
      });

      const pkg = pkgs.length > 0 ? pkgs[0] : null;

      if (pkg && node.parentId !== pkg.id) {
        const pkgAbs = getAbsNodePos(pkg);
        setNodes(nds => nds.map(n => {
          if (n.id === node.id) {
            return {
              ...n,
              parentId: pkg.id,
              position: { x: absX - pkgAbs.x, y: absY - pkgAbs.y }
            };
          }
          return n;
        }));
      } else if (!pkg && node.parentId) {
        setNodes(nds => nds.map(n => {
          if (n.id === node.id) {
            return {
              ...n,
              parentId: undefined,
              position: { x: absX, y: absY }
            };
          }
          return n;
        }));
      }
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <marker id="inheritance-end-light" markerWidth="14" markerHeight="14" refX="14" refY="7" orient="auto">
            <polygon points="0,0 0,14 14,7" fill="#fff" stroke="#000" strokeWidth="1.5" />
          </marker>
          <marker id="inheritance-end-dark" markerWidth="14" markerHeight="14" refX="14" refY="7" orient="auto">
            <polygon points="0,0 0,14 14,7" fill="#1e1e1e" stroke="#fff" strokeWidth="1.5" />
          </marker>
          <marker id="composition-start-light" markerWidth="14" markerHeight="14" refX="0" refY="7" orient="auto">
            <polygon points="0,7 7,0 14,7 7,14" fill="#000" stroke="#000" strokeWidth="1" />
          </marker>
          <marker id="composition-start-dark" markerWidth="14" markerHeight="14" refX="0" refY="7" orient="auto">
            <polygon points="0,7 7,0 14,7 7,14" fill="#fff" stroke="#fff" strokeWidth="1" />
          </marker>
          <marker id="aggregation-start-light" markerWidth="14" markerHeight="14" refX="0" refY="7" orient="auto">
            <polygon points="0,7 7,0 14,7 7,14" fill="#fff" stroke="#000" strokeWidth="1.5" />
          </marker>
          <marker id="aggregation-start-dark" markerWidth="14" markerHeight="14" refX="0" refY="7" orient="auto">
            <polygon points="0,7 7,0 14,7 7,14" fill="#1e1e1e" stroke="#fff" strokeWidth="1.5" />
          </marker>
        </defs>
      </svg>
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
        onNodesDelete={onNodesDelete}
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
            minWidth: '160px'
          }}
          onContextMenu={(e) => e.preventDefault()}
          role="presentation"
        >
          <div style={{ padding: '4px 8px', fontSize: '12px', fontWeight: 'bold', color: isDarkMode ? '#bbb' : '#666', borderBottom: '1px solid #ccc', marginBottom: '4px' }}>
            Tipo de Relación
          </div>
          {[
            { type: 'association', label: 'Asociación (-->)' },
            { type: 'inheritance', label: 'Herencia (--|>)' },
            { type: 'composition', label: 'Composición (*--)' },
            { type: 'aggregation', label: 'Agregación (o--)' },
            { type: 'dependency', label: 'Dependencia (..>)' },
            { type: 'realization', label: 'Realización (..|>)' }
          ].map(rel => (
            <button
              key={rel.type}
              onPointerDown={(e) => {
                e.stopPropagation();
                setEdges(eds => eds.map(edge => {
                  if (edge.id === edgeMenu.id) {
                    const isDashed = rel.type === 'dependency' || rel.type === 'realization';
                    const newMarkerEndType = (rel.type === 'inheritance' || rel.type === 'realization') ? `inheritance-end-${isDarkMode ? 'dark' : 'light'}` : 
                                         (rel.type !== 'composition' && rel.type !== 'aggregation' ? MarkerType.ArrowClosed : undefined);
                    
                    let newMarkerEndObj = newMarkerEndType;
                    if (newMarkerEndType === MarkerType.ArrowClosed) newMarkerEndObj = { type: MarkerType.ArrowClosed };
                    
                    const newMarkerStart = rel.type === 'composition' ? `composition-start-${isDarkMode ? 'dark' : 'light'}` :
                                           rel.type === 'aggregation' ? `aggregation-start-${isDarkMode ? 'dark' : 'light'}` : undefined;
                     
                    return {
                      ...edge,
                      data: { ...edge.data, relationType: rel.type },
                      style: isDashed ? { strokeDasharray: '5 5' } : {},
                      markerEnd: newMarkerEndObj,
                      markerStart: newMarkerStart
                    };
                  }
                  return edge;
                }));
                setEdgeMenu(null);
                isUndoRedoAction.current = false;
              }}
              style={{
                background: 'transparent',
                color: isDarkMode ? '#eee' : '#333',
                border: 'none',
                padding: '6px 12px',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                fontSize: '13px',
                borderRadius: '4px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = isDarkMode ? '#444' : '#e0e0e0'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              {rel.label}
            </button>
          ))}
          <div style={{ height: '1px', background: '#ccc', margin: '4px 0' }} />
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