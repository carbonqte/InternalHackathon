import { useMemo } from 'react'
import { ReactFlow, Controls } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import StepNode from './StepNode.jsx'
import { toFlow } from '../lib/graph.js'
import { useLang } from '../lib/i18n.jsx'
import { useTextScale } from '../lib/textsize.js'

const nodeTypes = { step: StepNode }

export default function RoadmapGraph({ steps, done, selectedId, onSelect, fresh }) {
  const { t } = useLang()
  const scale = useTextScale()
  const { nodes, edges } = useMemo(() => toFlow(steps, done, selectedId, fresh, scale), [steps, done, selectedId, fresh, scale])
  return (
    <div>
    <div style={{ height: Math.round(560 * scale * scale) }} className="rounded-xl border border-line bg-card">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, n) => onSelect(n.id)}
        nodesDraggable={false}
        nodesConnectable={false}
        fitView
        fitViewOptions={{ padding: 0.08, maxZoom: 1 }}
        key={scale}
        proOptions={{ hideAttribution: true }}
      >
        <Controls showInteractive={false} aria-label="Zoom controls" />
      </ReactFlow>
    </div>
    <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label={t.legend}>
      <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-sm border-2 border-accent bg-card" />{t.legAvail}</span>
      <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-sm border-2 border-done bg-card" />{t.legDone}</span>
      <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-sm border-2 border-dashed border-muted bg-card" />{t.legLocked}</span>
    </p>
    </div>
  )
}
