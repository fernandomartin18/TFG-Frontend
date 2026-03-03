/* eslint-disable react/prop-types */
import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow } from '@xyflow/react';

function UmlEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data
}) {
  const { setEdges } = useReactFlow();
  
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const updateData = (key, value) => {
    setEdges((edges) => edges.map(e => {
      if (e.id === id) {
        return { ...e, data: { ...e.data, [key]: value } };
      }
      return e;
    }));
  };

  const srcMultX = sourceX + (targetX - sourceX) * 0.2;
  const srcMultY = sourceY + (targetY - sourceY) * 0.2;
  
  const tgtMultX = sourceX + (targetX - sourceX) * 0.8;
  const tgtMultY = sourceY + (targetY - sourceY) * 0.8;

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} interactionWidth={25} />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            zIndex: 20
          }}
          className="nodrag nopan"
        >
          <input
            value={data?.label || ''}
            onChange={(e) => updateData('label', e.target.value)}
            placeholder=""
            style={{ 
              width: '80px', 
              background: 'transparent', 
              color: 'var(--text-primary)', 
              border: 'none', 
              outline: 'none', 
              textAlign: 'center', 
              fontSize: '12px'
            }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${srcMultX}px,${srcMultY}px)`,
            pointerEvents: 'all',
            fontSize: '11px',
            background: 'transparent',
            zIndex: 20
          }}
          className="nodrag nopan"
        >
          <input
            value={data?.sourceMultiplicity || ''}
            onChange={(e) => updateData('sourceMultiplicity', e.target.value)}
            placeholder=""
            style={{ 
              width: '40px', 
              background: 'transparent', 
              color: '#ff8800', 
              border: 'none', 
              outline: 'none', 
              textAlign: 'center', 
              fontSize: '12px', 
              fontWeight: 'bold'
            }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${tgtMultX}px,${tgtMultY}px)`,
            pointerEvents: 'all',
            fontSize: '11px',
            background: 'transparent',
            zIndex: 20
          }}
          className="nodrag nopan"
        >
          <input
            value={data?.targetMultiplicity || ''}
            onChange={(e) => updateData('targetMultiplicity', e.target.value)}
            placeholder=""
            style={{ 
              width: '40px', 
              background: 'transparent', 
              color: '#ff8800', 
              border: 'none', 
              outline: 'none', 
              textAlign: 'center', 
              fontSize: '12px', 
              fontWeight: 'bold'
            }}
          />
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default UmlEdge;