/* eslint-disable react/prop-types */
import React from 'react';
import { NodeResizer, useReactFlow } from '@xyflow/react';

function UmlPackage({ id, data, selected }) {
  const { setNodes, setEdges } = useReactFlow();

  const updateLabel = (val) => {
    setNodes((nds) => nds.map((n) => {
      if (n.id === id) {
        return { ...n, data: { ...n.data, label: val } };
      }
      return n;
    }));
  };

  const deleteNode = () => {
    setNodes((nds) => nds.filter((n) => n.id !== id && n.parentId !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  };

  return (
    <>
      <NodeResizer color="#ff0071" isVisible={selected} minWidth={100} minHeight={100} />
      <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '2px dashed #888',
        borderRadius: '8px',
        position: 'relative',
        zIndex: -1,
      }}>
        {/* Delete Button */}
        <button 
          className="nodrag"
          onClick={deleteNode} 
          style={{
            position: 'absolute', top: '-10px', right: '-10px', 
            background: 'red', color: 'white', border: 'none', 
            borderRadius: '50%', width: '20px', height: '20px', 
            cursor: 'pointer', fontSize: '10px', zIndex: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
          ✕
        </button>

        {/* Tab / Title */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          backgroundColor: '#888',
          color: 'white',
          padding: '2px 8px',
          borderBottomRightRadius: '8px',
          borderTopLeftRadius: '6px',
          fontWeight: 'bold',
          fontSize: '12px'
        }}>
          <input 
            className="nodrag"
            value={data.label}
            onChange={(e) => updateLabel(e.target.value)}
            style={{
              width: '100px', background: 'transparent', border: 'none', 
              color: 'inherit', fontWeight: 'bold', 
              outline: 'none', fontSize: '12px'
            }}
          />
        </div>
      </div>
    </>
  );
}

export default UmlPackage;