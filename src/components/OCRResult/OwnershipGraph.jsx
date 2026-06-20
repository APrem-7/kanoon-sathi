import React, { useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FileText, User, Home } from 'lucide-react';

const CustomNode = ({ data }) => {
  const Icon = data.icon || FileText;
  
  return (
    <div className="glass px-4 py-3 rounded-lg flex flex-col items-center justify-center min-w-[150px] shadow-lg">
      <div className="flex items-center gap-2 mb-2 text-indigo-400">
        <Icon size={18} />
        <span className="text-xs font-semibold uppercase tracking-wider">{data.type}</span>
      </div>
      <div className="text-sm font-medium text-slate-200 text-center">
        {data.label}
      </div>
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export default function OwnershipGraph({ data }) {
  const { seller, buyer, property, relationships } = data;

  const initialNodes = useMemo(() => {
    const nodes = [];
    
    if (seller?.name) {
      nodes.push({
        id: 'seller',
        type: 'custom',
        position: { x: 0, y: 0 },
        data: { label: seller.name, type: 'Seller', icon: User }
      });
    }

    if (property?.location || property?.surveyNo || property?.area) {
      nodes.push({
        id: 'property',
        type: 'custom',
        position: { x: 300, y: 0 },
        data: { label: property.location || property.surveyNo || 'Property', type: 'Property', icon: Home }
      });
    }

    if (buyer?.name) {
      nodes.push({
        id: 'buyer',
        type: 'custom',
        position: { x: 600, y: 0 },
        data: { label: buyer.name, type: 'Buyer', icon: User }
      });
    }
    
    return nodes;
  }, [seller, buyer, property]);

  const initialEdges = useMemo(() => {
    if (!relationships || relationships.length === 0) {
      // Fallback standard edges
      return [
        {
          id: 'e-seller-prop',
          source: 'seller',
          target: 'property',
          label: 'owns',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
          style: { stroke: '#f59e0b' }
        },
        {
          id: 'e-prop-buyer',
          source: 'property',
          target: 'buyer',
          label: 'transferred to',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
          style: { stroke: '#10b981' }
        }
      ];
    }
    
    return relationships.map((rel, idx) => ({
      id: `e-${idx}`,
      source: rel.source.toLowerCase(),
      target: rel.target.toLowerCase(),
      label: rel.label,
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
      style: { stroke: '#6366f1' }
    }));
  }, [relationships]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  if (initialNodes.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 glass rounded-xl">
        No graph data available.
      </div>
    );
  }

  return (
    <div className="h-[500px] w-full glass rounded-xl overflow-hidden relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#ffffff" gap={16} size={1} opacity={0.05} />
        <Controls className="glass !bg-transparent !border-white/10 fill-white" />
      </ReactFlow>
    </div>
  );
}
