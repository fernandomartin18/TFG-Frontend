/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';

function UmlNode({ id, data }) {
  const [newAttr, setNewAttr] = useState('');
  const { setNodes, setEdges } = useReactFlow();
  
  const handleAddAttr = (e) => {
    e.preventDefault();
    if (newAttr.trim()) {
      setNodes((nds) => nds.map((n) => {
        if (n.id === id) {
          return { ...n, data: { ...n.data, attributes: [...(n.data.attributes || []), newAttr.trim()] } };
        }
        return n;
      }));
      setNewAttr('');
    }
  };

  const updateAttr = (idx, val) => {
    setNodes((nds) => nds.map((n) => {
      if (n.id === id) {
        const newAttrs = [...(n.data.attributes || [])];
        newAttrs[idx] = val;
        return { ...n, data: { ...n.data, attributes: newAttrs } };
      }
      return n;
    }));
  };

  const deleteAttr = (idx) => {
    setNodes((nds) => nds.map((n) => {
      if (n.id === id) {
        const newAttrs = [...(n.data.attributes || [])];
        newAttrs.splice(idx, 1);
        return { ...n, data: { ...n.data, attributes: newAttrs } };
      }
      return n;
    }));
  };

  const updateLabel = (val) => {
    setNodes((nds) => nds.map((n) => {
      if (n.id === id) {
        return { ...n, data: { ...n.data, label: val } };
      }
      return n;
    }));
  };

  const deleteNode = () => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  };

  return (
    <div style={{
      border: '1px solid #777',
      borderRadius: '5px',
      backgroundColor: 'var(--bg-secondary)',
      minWidth: '160px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      position: 'relative'
    }}>
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

      <Handle type="target" position={Position.Top} style={{ background: '#646cff', width: "12px", height: "12px", zIndex: 10 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#646cff', width: "12px", height: "12px", zIndex: 10 }} />
      
      <div style={{
        padding: '8px',
        fontWeight: 'bold',
        textAlign: 'center',
        borderBottom: '1px solid #777',
        backgroundColor: 'var(--header-bg)',
        borderTopLeftRadius: '4px',
        borderTopRightRadius: '4px'
      }}>
        <input 
          className="nodrag"
          value={data.label}
          onChange={(e) => updateLabel(e.target.value)}
          style={{
            width: '100%', background: 'transparent', border: 'none', 
            color: 'inherit', fontWeight: 'bold', textAlign: 'center', 
            outline: 'none', fontSize: '14px'
          }}
        />
      </div>
      
      <div style={{ padding: '8px', fontSize: '12px' }}>
        {(data.attributes || []).map((attr, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ marginRight: '4px', color: '#888' }}>•</span>
            <input
              className="nodrag"
              type="text"
              value={attr}
              onChange={(e) => updateAttr(idx, e.target.value)}
              style={{
                flex: 1,
                fontSize: '12px',
                padding: '2px',
                border: '1px solid transparent',
                background: 'transparent',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.border = '1px solid #555'}
              onBlur={(e) => e.target.style.border = '1px solid transparent'}
            />
            <button 
              className="nodrag"
              onClick={() => deleteAttr(idx)} 
              title="Borrar atributo"
              style={{ 
                background: 'none', border: 'none', color: '#ff4444', 
                cursor: 'pointer', padding: '0 4px', fontSize: '14px' 
              }}>
              ×
            </button>
          </div>
        ))}
        
        <form onSubmit={handleAddAttr} style={{ marginTop: '8px', display: 'flex' }}>
          <input
            className="nodrag"
            type="text"
            value={newAttr}
            onChange={(e) => setNewAttr(e.target.value)}
            placeholder="+ nuevo atributo"
            style={{
              width: '100%',
              fontSize: '11px',
              padding: '4px',
              border: '1px solid #555',
              borderRadius: '3px',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
        </form>
      </div>
    </div>
  );
}

export default UmlNode;