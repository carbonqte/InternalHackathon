import { useMemo } from 'react'
import { ReactFlow, Background, BackgroundVariant, Controls } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import StepNode from './StepNode.jsx'
import { toFlow } from '../lib/graph.js'
import { useLang } from '../lib/i18n.jsx'

const nodeTypes = { step: StepNode }

export default function RoadmapGraph({ steps, done, selectedId, onSelect, fresh }) {
  const { t } = useLang()
  const { nodes, edges } = useMemo(() => toFlow(steps, done, selectedId, fresh), [steps, done, selectedId, fresh])
  return (
    <div>
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
        <Controls showInteractive={false} aria-label="Zoom controls" />
      </ReactFlow>
    </div>
    <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label={t.legend}>
      <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-sm border-2 border-accent bg-white" />{t.legAvail}</span>
      <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-sm border-2 border-done bg-white" />{t.legDone}</span>
      <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-sm border-2 border-line bg-paper" />{t.legLocked}</span>
    </p>
    </div>
  )
}
