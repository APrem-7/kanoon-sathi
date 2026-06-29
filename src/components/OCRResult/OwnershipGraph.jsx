import React, { useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FileText, User, Home, FileSignature, Award, Info } from 'lucide-react';

// Custom node rendering with input/output handles on multiple sides
const CustomNode = ({ data }) => {
  const Icon = data.icon || FileText;
  
  return (
    <div className="custom-node">
      {/* Target connection handles */}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="t-left"
        style={{ top: '50%' }}
      />
      <Handle 
        type="target" 
        position={Position.Top} 
        id="t-top"
        style={{ left: '50%' }}
      />
      
      <div className="custom-node-header">
        <Icon size={14} />
        <span className="custom-node-type-label">{data.type}</span>
      </div>
      <div className="custom-node-name">
        {data.label}
      </div>
      {data.sublabel && (
        <div className="custom-node-detail" title={data.sublabel}>
          {data.sublabel}
        </div>
      )}

      {/* Source connection handles */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="s-right"
        style={{ top: '50%' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="s-bottom"
        style={{ left: '50%' }}
      />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

// Map synonym IDs to canonical IDs to ensure connections are established
const resolveNodeId = (id) => {
  if (!id) return '';
  const cleanId = id.toLowerCase().trim();
  if (cleanId === 'vendor' || cleanId === 'first party' || cleanId === 'seller') return 'seller';
  if (cleanId === 'purchaser' || cleanId === 'second party' || cleanId === 'buyer') return 'buyer';
  if (cleanId === 'asset' || cleanId === 'land' || cleanId === 'house' || cleanId === 'plot') return 'property';
  if (cleanId === 'reg' || cleanId === 'sub-registrar' || cleanId === 'office') return 'registration';
  return cleanId;
};

export default function OwnershipGraph({ data }) {
  const { seller, buyer, property, registration, relationships, deeds } = data;

  const isMultiDeed = deeds && Array.isArray(deeds) && deeds.length > 1;

  // Compute unique owners chronologically from deeds array
  const owners = useMemo(() => {
    if (!isMultiDeed) return [];
    
    const list = [];
    const addedNames = new Set();
    
    deeds.forEach((deed) => {
      const deedSeller = deed.seller || {};
      const deedBuyer = deed.buyer || {};
      
      if (deedSeller.name && !addedNames.has(deedSeller.name.toLowerCase().trim())) {
        addedNames.add(deedSeller.name.toLowerCase().trim());
        list.push({
          name: deedSeller.name,
          address: deedSeller.address || '',
          role: list.length === 0 ? 'Earliest Seller / Vendor' : 'Intermediate Owner'
        });
      }
      
      if (deedBuyer.name && !addedNames.has(deedBuyer.name.toLowerCase().trim())) {
        addedNames.add(deedBuyer.name.toLowerCase().trim());
        list.push({
          name: deedBuyer.name,
          address: deedBuyer.address || '',
          role: 'Intermediate Owner'
        });
      }
    });
    
    if (list.length > 0) {
      list[list.length - 1].role = 'Ultimate Buyer / Purchaser';
    }
    
    return list;
  }, [deeds, isMultiDeed]);

  const initialNodes = useMemo(() => {
    const nodes = [];

    if (isMultiDeed && owners.length > 0) {
      // ── MULTI-DEED HORIZONTAL OWNER TIMELINE FLOW ──
      owners.forEach((owner, idx) => {
        nodes.push({
          id: `owner-${idx}`,
          type: 'custom',
          position: { x: 80 + (idx * 300), y: 220 },
          data: {
            label: owner.name,
            sublabel: owner.address || '',
            type: owner.role,
            icon: User
          }
        });
      });

      // Property node centered below the owner chain
      if (property?.location || property?.surveyNo || property?.area) {
        const midX = 80 + (((owners.length - 1) * 300) / 2);
        nodes.push({
          id: 'property',
          type: 'custom',
          position: { x: midX, y: 400 },
          data: { 
            label: property.location || 'Deed Asset', 
            sublabel: [
              property.surveyNo ? `Survey: ${property.surveyNo}` : '',
              property.area ? `Area: ${property.area}` : ''
            ].filter(Boolean).join(' | '),
            type: 'Property / Plot', 
            icon: Home 
          }
        });
      }

      // Latest Registration Office centered above the owner chain
      const hasRegDetails = registration && Object.values(registration).some(v => v);
      if (hasRegDetails) {
        const midX = 80 + (((owners.length - 1) * 300) / 2);
        nodes.push({
          id: 'registration',
          type: 'custom',
          position: { x: midX, y: 40 },
          data: { 
            label: registration.regNo || 'Registration Details', 
            sublabel: registration.office || registration.date || 'Sub-Registrar Office', 
            type: 'Latest Registration Details', 
            icon: FileSignature 
          }
        });
      }

      return nodes;
    }

    // ── STANDARD SINGLE-DEED FLOW ──
    const coreNodeIds = [];

    // 1. Seller Node
    if (seller?.name) {
      coreNodeIds.push('seller');
      nodes.push({
        id: 'seller',
        type: 'custom',
        position: { x: 80, y: 220 },
        data: { 
          label: seller.name, 
          sublabel: seller.address || '', 
          type: 'Seller / Vendor', 
          icon: User 
        }
      });
    }

    // 2. Property Node
    if (property?.location || property?.surveyNo || property?.area) {
      coreNodeIds.push('property');
      nodes.push({
        id: 'property',
        type: 'custom',
        position: { x: 380, y: 220 },
        data: { 
          label: property.location || 'Deed Asset', 
          sublabel: [
            property.surveyNo ? `Survey: ${property.surveyNo}` : '',
            property.area ? `Area: ${property.area}` : ''
          ].filter(Boolean).join(' | '),
          type: 'Property / Plot', 
          icon: Home 
        }
      });
    }

    // 3. Buyer Node
    if (buyer?.name) {
      coreNodeIds.push('buyer');
      nodes.push({
        id: 'buyer',
        type: 'custom',
        position: { x: 680, y: 220 },
        data: { 
          label: buyer.name, 
          sublabel: buyer.address || '', 
          type: 'Buyer / Purchaser', 
          icon: User 
        }
      });
    }

    // 4. Registration Node
    const hasRegDetails = registration && Object.values(registration).some(v => v);
    if (hasRegDetails) {
      coreNodeIds.push('registration');
      nodes.push({
        id: 'registration',
        type: 'custom',
        position: { x: 380, y: 50 },
        data: { 
          label: registration.regNo || 'Registration Details', 
          sublabel: registration.office || registration.date || 'Sub-Registrar Office', 
          type: 'Registration Office', 
          icon: FileSignature 
        }
      });
    }

    // 5. Dynamic nodes based on custom relationships
    if (relationships && Array.isArray(relationships)) {
      let customNodeCount = 0;
      const addedNodes = new Set(coreNodeIds);

      relationships.forEach(rel => {
        const resolvedSrc = resolveNodeId(rel.source);
        const resolvedTgt = resolveNodeId(rel.target);

        [resolvedSrc, resolvedTgt].forEach(id => {
          if (id && !addedNodes.has(id)) {
            addedNodes.add(id);

            // Determine custom labels and styles
            let label = id.charAt(0).toUpperCase() + id.slice(1);
            let type = 'Associated Entity';
            let icon = Award;

            if (id.includes('witness')) {
              type = 'Witness';
              icon = User;
            } else if (id.includes('agent') || id.includes('broker')) {
              type = 'Broker / Agent';
              icon = User;
            } else if (id.includes('bank') || id.includes('loan') || id.includes('mortgage')) {
              type = 'Financial Institution';
              icon = FileText;
            }

            const customX = 80 + (customNodeCount * 300);
            const customY = 380;
            customNodeCount++;

            nodes.push({
              id,
              type: 'custom',
              position: { x: customX, y: customY },
              data: { label, type, icon }
            });
          }
        });
      });
    }
    
    return nodes;
  }, [seller, buyer, property, registration, relationships, owners, isMultiDeed]);

  const initialEdges = useMemo(() => {
    if (isMultiDeed && owners.length > 0) {
      const edges = [];
      
      // Connect horizontal sequence of owners
      deeds.forEach((deed, index) => {
        const dSeller = deed.seller?.name;
        const dBuyer = deed.buyer?.name;
        
        if (dSeller && dBuyer) {
          const srcIdx = owners.findIndex(o => o.name.toLowerCase().trim() === dSeller.toLowerCase().trim());
          const tgtIdx = owners.findIndex(o => o.name.toLowerCase().trim() === dBuyer.toLowerCase().trim());
          
          if (srcIdx !== -1 && tgtIdx !== -1) {
            const label = [
              deed.date ? deed.date : '',
              deed.saleAmount ? `for ${deed.saleAmount}` : ''
            ].filter(Boolean).join(' | ') || 'Transferred';
            
            edges.push({
              id: `e-transfer-${index}`,
              source: `owner-${srcIdx}`,
              target: `owner-${tgtIdx}`,
              label: label,
              animated: true,
              markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
              style: { stroke: '#10b981' }
            });
          }
        }
      });

      // Connect earliest owner and ultimate owner to the property node
      edges.push({
        id: 'e-first-owner-prop',
        source: 'owner-0',
        target: 'property',
        label: 'original owner',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
        style: { stroke: '#f59e0b', strokeDasharray: '4 4' }
      });
      
      edges.push({
        id: 'e-last-owner-prop',
        source: 'property',
        target: `owner-${owners.length - 1}`,
        label: 'current owner',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
        style: { stroke: '#10b981' }
      });

      // Connect registration node if exists
      const hasRegDetails = registration && Object.values(registration).some(v => v);
      if (hasRegDetails) {
        edges.push({
          id: 'e-reg-prop',
          source: 'registration',
          target: 'property',
          label: 'registered latest',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
          style: { stroke: '#6366f1', strokeDasharray: '2 2' }
        });
      }

      return edges;
    }

    // Default fallback edges if relationships are missing or empty
    if (!relationships || relationships.length === 0) {
      return [
        {
          id: 'e-seller-prop',
          source: 'seller',
          target: 'property',
          label: 'owns / sells',
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
    
    return relationships.map((rel, idx) => {
      const src = resolveNodeId(rel.source);
      const tgt = resolveNodeId(rel.target);

      // Color coding edges by connection type
      let strokeColor = '#6366f1'; // Indigo default
      const labelLower = (rel.label || '').toLowerCase();
      
      if (labelLower.includes('sell') || labelLower.includes('own') || labelLower.includes('vendor')) {
        strokeColor = '#f59e0b'; // Amber for ownership
      } else if (labelLower.includes('transfer') || labelLower.includes('buy') || labelLower.includes('convey')) {
        strokeColor = '#10b981'; // Green for transfer
      } else if (labelLower.includes('pay') || labelLower.includes('price') || labelLower.includes('consideration')) {
        strokeColor = '#34d399'; // Emerald for payment
      } else if (labelLower.includes('witness')) {
        strokeColor = '#a78bfa'; // Purple for witnesses
      }
      
      return {
        id: `e-${idx}`,
        source: src,
        target: tgt,
        label: rel.label || 'relates to',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor },
        style: { stroke: strokeColor }
      };
    });
  }, [relationships, owners, deeds, isMultiDeed, registration]);

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
    <div className="graph-canvas-container">
      {/* Visual Instruction Badge */}
      <div className="graph-instruction-toast">
        <Info size={14} />
        <span>Nodes are interactive. Drag nodes to reposition the layout.</span>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#ffffff" gap={16} size={1} opacity={0.03} />
        <Controls className="react-flow__controls" />
      </ReactFlow>
    </div>
  );
}
