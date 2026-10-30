import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { CANVAS_NODES, CANVAS_EDGES, type CanvasNode, type CanvasEdge } from '../../data/expressData'

const NODE_W = 160
const NODE_H = 56

// Helper: center of a node
const center = (n: CanvasNode) => ({
  x: n.x + NODE_W / 2,
  y: n.y + NODE_H / 2,
})

// ── Dashed animated edge ────────────────────────────────────────────────────────
const Edge = ({
  from,
  to,
  label,
}: {
  from: CanvasNode
  to: CanvasNode
  label?: string
}) => {
  const f = center(from)
  const t = center(to)

  // Curved control point (slight horizontal bow)
  const mx = (f.x + t.x) / 2
  const my = (f.y + t.y) / 2 - 18

  const path = `M ${f.x} ${f.y} Q ${mx} ${my} ${t.x} ${t.y}`
  const midX = (f.x + mx + t.x) / 3
  const midY = (f.y + my + t.y) / 3 - 10

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
        strokeDasharray="4 4"
        style={{
          animation: 'dash-flow 3s linear infinite',
        }}
      />
      {/* Arrowhead approximation */}
      <circle cx={t.x} cy={t.y} r={2} fill="rgba(255,255,255,0.25)" />
      {label && (
        <text
          x={midX}
          y={midY}
          fill="rgba(255,255,255,0.2)"
          fontSize="8"
          fontFamily="JetBrains Mono, monospace"
          textAnchor="middle"
        >
          {label}
        </text>
      )}
    </g>
  )
}

// ── Glass node ─────────────────────────────────────────────────────────────────
const CanvasNodeEl = ({
  node,
  selected,
  onClick,
}: {
  node: CanvasNode
  selected: boolean
  onClick: () => void
}) => (
  <g
    transform={`translate(${node.x},${node.y})`}
    style={{ cursor: 'pointer' }}
    onClick={onClick}
    role="button"
    aria-label={node.label}
  >
    {/* Glow ring when selected */}
    {selected && (
      <rect
        x="-2"
        y="-2"
        width={NODE_W + 4}
        height={NODE_H + 4}
        rx="14"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1"
      />
    )}
    {/* Glass surface */}
    <rect
      x="0"
      y="0"
      width={NODE_W}
      height={NODE_H}
      rx="12"
      fill={selected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}
      stroke={selected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}
      strokeWidth="1"
    />
    {/* Label */}
    <text
      x={NODE_W / 2}
      y={NODE_H / 2 - 6}
      fill={selected ? '#ffffff' : '#e4e4e7'}
      fontSize="12"
      fontFamily="Inter, sans-serif"
      fontWeight="500"
      textAnchor="middle"
      dominantBaseline="middle"
    >
      {node.label}
    </text>
    {/* Sublabel */}
    <text
      x={NODE_W / 2}
      y={NODE_H / 2 + 12}
      fill="rgba(255,255,255,0.3)"
      fontSize="8.5"
      fontFamily="JetBrains Mono, monospace"
      textAnchor="middle"
      dominantBaseline="middle"
    >
      {node.sublabel}
    </text>
  </g>
)

// ── Zoom controls ──────────────────────────────────────────────────────────────
const ZoomControls = ({
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}) => (
  <div
    className="absolute bottom-6 left-6 flex flex-col gap-1 z-20"
    role="group"
    aria-label="Zoom controls"
  >
    {[
      { id: 'zoom-in', label: '+', onClick: onZoomIn, title: 'Zoom in' },
      { id: 'zoom-out', label: '−', onClick: onZoomOut, title: 'Zoom out' },
      { id: 'zoom-reset', label: '⊡', onClick: onReset, title: 'Reset view' },
    ].map(btn => (
      <button
        key={btn.id}
        id={btn.id}
        onClick={btn.onClick}
        title={btn.title}
        aria-label={btn.title}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-all duration-150"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.09)',
          color: '#71717a',
          fontFamily: 'monospace',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.background = 'rgba(255,255,255,0.09)'
          el.style.color = '#ffffff'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.background = 'rgba(255,255,255,0.04)'
          el.style.color = '#71717a'
        }}
      >
        {btn.label}
      </button>
    ))}
  </div>
)

interface SystemCanvasProps {
  nodes?: CanvasNode[]
  edges?: CanvasEdge[]
}

// ── Main SystemCanvas ──────────────────────────────────────────────────────────
const SystemCanvas = ({
  nodes = CANVAS_NODES,
  edges = CANVAS_EDGES,
}: SystemCanvasProps) => {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Compute SVG viewbox bounds
  const allX = nodes.map(n => n.x + NODE_W)
  const allY = nodes.map(n => n.y + NODE_H)
  const svgW = Math.max(...allX, 700) + 80
  const svgH = Math.max(...allY, 550) + 80

  const zoomIn = () => setScale(s => Math.min(s + 0.15, 2.5))
  const zoomOut = () => setScale(s => Math.max(s - 0.15, 0.4))
  const resetView = () => { setScale(1); setOffset({ x: 0, y: 0 }) }

  // Pan handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as SVGElement).closest('[role="button"]')) return
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y }
    setDragging(true)
  }, [offset])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragStart.current) return
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.mx),
      y: dragStart.current.oy + (e.clientY - dragStart.current.my),
    })
  }, [])

  const onMouseUp = useCallback(() => {
    dragStart.current = null
    setDragging(false)
  }, [])

  const selectedNodeData = selectedNode
    ? nodes.find(n => n.id === selectedNode)
    : null

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{ cursor: dragging ? 'grabbing' : 'grab' }}
      aria-label="Architecture canvas"
    >
      {/* Dot matrix background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Dashed animation keyframe */}
      <style>{`
        @keyframes dash-flow {
          to { stroke-dashoffset: -24; }
        }
      `}</style>

      {/* SVG Canvas */}
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: dragging ? 'none' : 'transform 0.15s ease',
          userSelect: 'none',
        }}
      >
        {/* Edges */}
        {edges.map((edge, i) => {
          const fromNode = nodes.find(n => n.id === edge.from)
          const toNode = nodes.find(n => n.id === edge.to)
          if (!fromNode || !toNode) return null
          return (
            <Edge key={i} from={fromNode} to={toNode} label={edge.label} />
          )
        })}

        {/* Nodes */}
        {nodes.map(node => (
          <CanvasNodeEl
            key={node.id}
            node={node}
            selected={selectedNode === node.id}
            onClick={() => setSelectedNode(prev => prev === node.id ? null : node.id)}
          />
        ))}
      </svg>

      {/* Selected node tooltip */}
      {selectedNodeData && (
        <motion.div
          key={selectedNodeData.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.18 }}
          className="absolute top-4 right-4 p-3 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.14)',
            minWidth: '180px',
          }}
        >
          <p className="text-xs font-medium mb-0.5" style={{ color: '#e4e4e7' }}>
            {selectedNodeData.label}
          </p>
          <p
            className="text-[10px]"
            style={{ color: '#71717a', fontFamily: "'JetBrains Mono', monospace" }}
          >
            {selectedNodeData.sublabel}
          </p>
        </motion.div>
      )}

      {/* Zoom controls */}
      <ZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetView} />

      {/* Hint */}
      <p
        className="absolute bottom-6 right-6 text-[10px]"
        style={{ color: '#27272a', fontFamily: "'JetBrains Mono', monospace" }}
      >
        drag to pan · scroll to zoom
      </p>
    </div>
  )
}

export default SystemCanvas
