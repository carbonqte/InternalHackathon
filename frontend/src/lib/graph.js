import dagre from '@dagrejs/dagre'

export const NODE_W = 220
export const NODE_H = 72

/** Step state: done if ticked, available if every dependency is done, else locked. */
export function stepState(step, done) {
  if (done.has(step.id)) return 'done'
  return step.depends_on.every((d) => done.has(d)) ? 'available' : 'locked'
}

/** Kahn's algorithm: gives a valid reading order for the list view. */
export function topoOrder(steps) {
  const indeg = new Map(steps.map((s) => [s.id, s.depends_on.length]))
  const out = new Map(steps.map((s) => [s.id, []]))
  steps.forEach((s) => s.depends_on.forEach((d) => out.get(d)?.push(s.id)))
  const queue = steps.filter((s) => indeg.get(s.id) === 0).map((s) => s.id)
  const order = []
  while (queue.length) {
    const id = queue.shift()
    order.push(id)
    out.get(id).forEach((n) => { indeg.set(n, indeg.get(n) - 1); if (indeg.get(n) === 0) queue.push(n) })
  }
  const byId = new Map(steps.map((s) => [s.id, s]))
  return order.map((id) => byId.get(id))
}

/** Convert steps → React Flow nodes/edges with a top-to-bottom dagre layout. */
export function toFlow(steps, done, selectedId, fresh, scale = 1) {
  const W = Math.round(NODE_W * scale), H = Math.round(NODE_H * scale * scale * 1.12)
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'TB', nodesep: 40 * scale, ranksep: 60 * scale })
  g.setDefaultEdgeLabel(() => ({}))
  steps.forEach((s) => g.setNode(s.id, { width: W, height: H }))
  steps.forEach((s) => s.depends_on.forEach((d) => g.setEdge(d, s.id)))
  dagre.layout(g)
  const stageOf = new Map()
  stages(steps).forEach((grp, i) => grp.forEach((s) => stageOf.set(s.id, i + 1)))

  const nodes = steps.map((s) => {
    const { x, y } = g.node(s.id)
    return {
      id: s.id,
      type: 'step',
      position: { x: x - W / 2, y: y - H / 2 },
      data: { step: s, state: stepState(s, done), selected: s.id === selectedId, fresh: fresh?.has(s.id), stage: stageOf.get(s.id), first: s.depends_on.length === 0 && done.size === 0, w: W, h: H },
    }
  })
  const edges = steps.flatMap((s) =>
    s.depends_on.map((d) => ({
      id: `${d}-${s.id}`,
      source: d,
      target: s.id,
      animated: done.has(d) && !done.has(s.id),
      style: { stroke: done.has(d) ? 'var(--color-done)' : 'var(--color-line)', strokeWidth: 2 },
    })),
  )
  return { nodes, edges }
}

/** Group steps into numbered stages: a step's stage = 1 + deepest dependency. Same stage = can be done in parallel. */
export function stages(steps) {
  const byId = new Map(steps.map((s) => [s.id, s]))
  const memo = new Map()
  const depth = (id) => {
    if (memo.has(id)) return memo.get(id)
    const d = Math.max(0, ...byId.get(id).depends_on.filter((x) => byId.has(x)).map((x) => depth(x) + 1))
    memo.set(id, d); return d
  }
  const out = []
  topoOrder(steps).forEach((s) => { (out[depth(s.id)] ||= []).push(s) })
  return out
}
