import { useMemo } from 'react'
import { ReactFlow, Background, BackgroundVariant, Controls } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import StepNode from './StepNode.jsx'
import { toFlow } from '../lib/graph.js'

const nodeTypes = { step: StepNode }

export default function RoadmapGraph({ steps, done, selectedId, onSelect, fresh }) {
  const { nodes, edges } = useMemo(() => toFlow(steps, done, selectedId, fresh), [steps, done, selectedId, fresh])
  return (
    <div className="h-[520px] rounded-xl border border-line bg-white/60">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, n) => onSelect(n.id)}
        nodesDraggable={false}
        nodesConnectable={false}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Lines} color="#efe9dd" gap={40} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
