import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen, X } from 'lucide-react'
import { FILE_TREE, type FileNode } from '../../data/expressData'

interface FilePreviewCard {
  node: FileNode
  anchorId: string
}

interface FileExplorerProps {
  open: boolean
  onFileSelect?: (node: FileNode) => void
  tree?: FileNode[]
}

// ── Inline file-type icon helper ──────────────────────────────────────────────
const FileIcon = ({ name }: { name: string }) => {
  const ext = name.split('.').pop() ?? ''
  const color =
    ext === 'json' ? '#71717a' :
    ext === 'md' ? '#a1a1aa' :
    ext === 'js' || ext === 'ts' ? '#a1a1aa' :
    '#71717a'
  return <FileText size={12} strokeWidth={1.5} style={{ color, flexShrink: 0 }} />
}

// ── Recursive tree node ────────────────────────────────────────────────────────
const TreeNode = ({
  node,
  depth = 0,
  selectedId,
  onSelect,
}: {
  node: FileNode
  depth?: number
  selectedId: string | null
  onSelect: (n: FileNode) => void
}) => {
  const [expanded, setExpanded] = useState(depth === 0)
  const isSelected = selectedId === node.id
  const indent = depth * 12

  if (node.type === 'dir') {
    return (
      <div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center gap-1.5 py-1 px-2 rounded-md transition-all duration-150 text-left"
          style={{
            paddingLeft: `${8 + indent}px`,
            color: '#71717a',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa')}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = '#71717a')}
        >
          {expanded
            ? <ChevronDown size={10} strokeWidth={2} style={{ flexShrink: 0 }} />
            : <ChevronRight size={10} strokeWidth={2} style={{ flexShrink: 0 }} />}
          {expanded
            ? <FolderOpen size={12} strokeWidth={1.5} style={{ flexShrink: 0, color: '#a1a1aa' }} />
            : <Folder size={12} strokeWidth={1.5} style={{ flexShrink: 0, color: '#71717a' }} />}
          <span className="truncate">{node.name}</span>
        </button>
        <AnimatePresence initial={false}>
          {expanded && node.children && (
            <motion.div
              key="children"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              {node.children.map(child => (
                <TreeNode
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  selectedId={selectedId}
                  onSelect={onSelect}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <button
      id={`file-${node.id}`}
      onClick={() => onSelect(node)}
      className="w-full flex items-center gap-1.5 py-1 px-2 rounded-md transition-all duration-150 text-left"
      style={{
        paddingLeft: `${8 + indent}px`,
        background: isSelected ? 'rgba(255,255,255,0.08)' : 'transparent',
        color: isSelected ? '#ffffff' : '#71717a',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px',
      }}
      onMouseEnter={e => {
        if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'
      }}
      onMouseLeave={e => {
        if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
      }}
      aria-label={`Select file ${node.name}`}
      aria-current={isSelected ? 'true' : undefined}
    >
      <FileIcon name={node.name} />
      <span className="truncate flex-1">{node.name}</span>
      {node.lines && (
        <span className="text-[9px] flex-shrink-0" style={{ color: '#3f3f46' }}>
          {node.lines}L
        </span>
      )}
    </button>
  )
}

// ── Floating file preview card ─────────────────────────────────────────────────
const FilePreviewCard = ({
  node,
  onClose,
}: {
  node: FileNode
  onClose: () => void
}) => (
  <motion.div
    key={node.id}
    initial={{ opacity: 0, scale: 0.97, y: 6 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.97, y: 4 }}
    transition={{ duration: 0.18, ease: 'easeOut' }}
    className="absolute bottom-4 left-4 right-4 z-50 p-4 rounded-xl"
    style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.14)',
      boxShadow: '0 16px 48px 0 rgba(0,0,0,0.8)',
    }}
    role="dialog"
    aria-label={`Preview of ${node.name}`}
  >
    {/* Header */}
    <div className="flex items-start justify-between gap-2 mb-3">
      <div className="flex items-center gap-2 min-w-0">
        <FileIcon name={node.name} />
        <span
          className="text-xs font-medium truncate"
          style={{ color: '#e4e4e7', fontFamily: "'JetBrains Mono', monospace" }}
        >
          {node.name}
        </span>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded"
        style={{ color: '#52525b' }}
        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa')}
        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = '#52525b')}
        aria-label="Close preview"
      >
        <X size={11} strokeWidth={2} />
      </button>
    </div>

    {/* Summary */}
    {node.summary && (
      <p
        className="text-[11px] leading-relaxed mb-3"
        style={{ color: '#71717a', fontFamily: "'Inter', sans-serif" }}
      >
        {node.summary}
      </p>
    )}

    {/* Exports */}
    {node.exports && node.exports.length > 0 && (
      <div className="flex flex-wrap gap-1">
        {node.exports.map(exp => (
          <span
            key={exp}
            className="px-1.5 py-0.5 rounded text-[10px]"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#a1a1aa',
            }}
          >
            {exp}
          </span>
        ))}
      </div>
    )}
  </motion.div>
)

// ── Main FileExplorer ─────────────────────────────────────────────────────────
const FileExplorer = ({ open, onFileSelect, tree = FILE_TREE }: FileExplorerProps) => {
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null)

  const handleSelect = (node: FileNode) => {
    setSelectedNode(prev => (prev?.id === node.id ? null : node))
    onFileSelect?.(node)
  }

  return (
    <motion.aside
      id="file-explorer"
      initial={false}
      animate={{ width: open ? 240 : 0, opacity: open ? 1 : 0 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex-shrink-0 h-full overflow-hidden"
      style={{
        borderRight: open ? '1px solid rgba(255,255,255,0.06)' : 'none',
        background: 'rgba(255,255,255,0.015)',
      }}
      aria-label="File explorer"
      aria-hidden={!open}
    >
      <div className="w-60 h-full flex flex-col overflow-hidden">
        {/* Explorer header */}
        <div
          className="flex-shrink-0 flex items-center px-3 py-2.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <span
            className="text-[10px] tracking-widest uppercase"
            style={{
              color: '#3f3f46',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.12em',
            }}
          >
            Files
          </span>
        </div>

        {/* Tree scroll area */}
        <div className="flex-1 overflow-y-auto py-1 px-1">
          {tree.map(node => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              selectedId={selectedNode?.id ?? null}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>

      {/* File preview card */}
      <AnimatePresence>
        {selectedNode && selectedNode.summary && (
          <FilePreviewCard
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </AnimatePresence>
    </motion.aside>
  )
}

export default FileExplorer
