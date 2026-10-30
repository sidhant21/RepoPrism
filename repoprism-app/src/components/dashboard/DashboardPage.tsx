import { useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import DashboardHeader from './DashboardHeader'
import FileExplorer from './FileExplorer'
import ContextCards from './ContextCards'
import SystemCanvas from './SystemCanvas'
import FirstIssues from './FirstIssues'
import AIQueryBar from './AIQueryBar'
import type {
  FileNode,
  ContextCard,
  CanvasNode,
  CanvasEdge,
  ContributionCard,
} from '../../data/expressData'

export type DashboardMode = 'context' | 'canvas' | 'issues'

interface DashboardPageProps {
  onBack: () => void
  data?: any | null
}

// ── Page transitions config ───────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
}
const pageTransition = { duration: 0.25, ease: 'easeInOut' as const }

// ── Main DashboardPage ─────────────────────────────────────────────────────────
const DashboardPage = ({ onBack, data }: DashboardPageProps) => {
  const [mode, setMode] = useState<DashboardMode>('context')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Map live data if available
  const mappedTree = useMemo<FileNode[] | undefined>(() => {
    if (!data?.fileTree) return undefined
    function mapNode(n: any): FileNode {
      return {
        id: n.path,
        name: n.name,
        type: n.type === 'folder' ? 'dir' : 'file',
        lines: n.lines ? parseInt(n.lines) || undefined : undefined,
        summary: `${n.path} (${n.lines || (n.type === 'folder' ? 'dir' : 'file')})`,
        children: n.children ? n.children.map(mapNode) : undefined,
      }
    }
    return data.fileTree.map(mapNode)
  }, [data])

  const mappedCards = useMemo<ContextCard[] | undefined>(() => {
    if (!data?.contextCards) return undefined
    return data.contextCards.map((c: any) => ({
      id: `card-${c.id}`,
      index: c.id,
      label: (c.tag || '').replace(/^\d+\s*\/\s*/, ''),
      tagline: c.title,
      bullets: c.bullets,
      files: (c.files || []).map((f: string) => ({
        label: f.split('/').pop() || f,
        path: f,
      })),
    }))
  }, [data])

  const mappedNodes = useMemo<CanvasNode[] | undefined>(() => {
    if (!data?.systemCanvas?.nodes) return undefined
    return data.systemCanvas.nodes.map((n: any) => ({
      id: n.id,
      label: n.label,
      sublabel: n.sublabel,
      x: n.x,
      y: n.y,
    }))
  }, [data])

  const mappedEdges = useMemo<CanvasEdge[] | undefined>(() => {
    if (!data?.systemCanvas?.edges) return undefined
    return data.systemCanvas.edges.map((e: any) => ({
      from: e.source,
      to: e.target,
      label: e.label,
    }))
  }, [data])

  const mappedIssues = useMemo<ContributionCard[] | undefined>(() => {
    if (!data?.firstIssues) return undefined
    return data.firstIssues.map((item: any, idx: number) => ({
      id: item.id || `issue-${idx}`,
      tag: item.type === 'github_issue' ? 'Good First Issue' : 'AI Detected Gap',
      number: item.issueUrl ? '#' + (item.issueUrl.split('/').pop() || '') : undefined,
      title: item.title,
      description: item.description,
      steps: item.steps || [],
      targetFile: item.targetFiles?.[0] || 'README.md',
      difficulty: item.difficulty === 'Moderate' ? 'Medium' : 'Easy',
    }))
  }, [data])

  return (
    <div
      id="dashboard-root"
      className="relative h-screen w-screen overflow-hidden flex flex-col"
      style={{ background: '#050505' }}
      aria-label="RepoPrism dashboard"
    >
      {/* ── Ambient background ── */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(circle at 60% 10%, rgba(255,255,255,0.04) 0%, transparent 55%)',
        }}
        aria-hidden="true"
      />

      {/* ── Header ── */}
      <div className="relative z-20">
        <DashboardHeader
          mode={mode}
          onModeChange={setMode}
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen((v) => !v)}
          onBack={onBack}
          repoMeta={data?.metadata}
        />
      </div>

      {/* ── Body: sidebar + main stage ── */}
      <div className="relative z-10 flex flex-1 min-h-0">
        {/* Left file explorer */}
        <FileExplorer open={sidebarOpen} tree={mappedTree} />

        {/* Center main stage */}
        <main
          id="main-stage"
          className="relative flex-1 min-w-0 overflow-hidden"
          aria-label={`Dashboard: ${mode} view`}
        >
          {/* Dot-matrix canvas texture */}
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              backgroundImage:
                'radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
            aria-hidden="true"
          />

          {/* Mode content with crossfade */}
          <div className="relative z-10 h-full w-full" style={{ paddingBottom: '88px' }}>
            <AnimatePresence mode="wait">
              {mode === 'context' && (
                <motion.div
                  key="context"
                  className="h-full w-full"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={pageTransition}
                >
                  <ContextCards
                    cards={mappedCards}
                    elevatorPitch={data?.elevatorPitch}
                    aiTitle={data?.aiTitle}
                    summary={data?.summary}
                  />
                </motion.div>
              )}
              {mode === 'canvas' && (
                <motion.div
                  key="canvas"
                  className="h-full w-full"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={pageTransition}
                >
                  <SystemCanvas nodes={mappedNodes} edges={mappedEdges} />
                </motion.div>
              )}
              {mode === 'issues' && (
                <motion.div
                  key="issues"
                  className="h-full w-full"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={pageTransition}
                >
                  <FirstIssues issues={mappedIssues} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Floating AI query bar ── */}
          <AIQueryBar
            repoUrl={
              data?.metadata
                ? `https://github.com/${data.metadata.owner}/${data.metadata.name}`
                : undefined
            }
          />
        </main>
      </div>
    </div>
  )
}

export default DashboardPage
