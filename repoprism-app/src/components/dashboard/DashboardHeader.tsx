import { motion } from 'framer-motion'
import { Triangle, Star, ChevronRight, PanelLeftClose, PanelLeftOpen, ArrowLeft } from 'lucide-react'
import type { DashboardMode } from './DashboardPage'
import { REPO_META } from '../../data/expressData'

const MODES: { id: DashboardMode; label: string; index: string }[] = [
  { id: 'context', index: '01', label: 'Context Cards' },
  { id: 'canvas', index: '02', label: 'System Canvas' },
  { id: 'issues', index: '03', label: 'First Issues' },
]

interface DashboardHeaderProps {
  mode: DashboardMode
  onModeChange: (m: DashboardMode) => void
  sidebarOpen: boolean
  onSidebarToggle: () => void
  onBack: () => void
  repoMeta?: {
    owner: string
    name: string
    stars: string
    defaultBranch?: string
    description?: string
  }
}

const DashboardHeader = ({
  mode,
  onModeChange,
  sidebarOpen,
  onSidebarToggle,
  onBack,
  repoMeta = REPO_META,
}: DashboardHeaderProps) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      id="dashboard-header"
      className="flex-shrink-0 h-14 flex items-center justify-between px-4 gap-3"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
      aria-label="Dashboard navigation"
    >
      {/* ── Left: Logo + Breadcrumb ── */}
      <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
        {/* Sidebar toggle */}
        <button
          id="sidebar-toggle-btn"
          onClick={onSidebarToggle}
          aria-label={sidebarOpen ? 'Collapse file tree' : 'Expand file tree'}
          className="flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-150"
          style={{ color: '#52525b' }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#52525b'
          }}
        >
          {sidebarOpen ? <PanelLeftClose size={14} strokeWidth={1.8} /> : <PanelLeftOpen size={14} strokeWidth={1.8} />}
        </button>

        {/* Logo mark */}
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <polygon points="16,2 30,26 2,26" fill="none" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
            <polygon points="16,10 23,22 9,22" fill="white" opacity="0.14" />
          </svg>
          <span className="text-white font-semibold text-sm" style={{ letterSpacing: '-0.02em' }}>
            RepoPrism
          </span>
        </div>

        {/* Breadcrumb */}
        <div className="hidden sm:flex items-center gap-1.5" style={{ color: '#52525b' }}>
          <ChevronRight size={12} strokeWidth={1.5} />
          <span className="text-xs" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#71717a' }}>
            {repoMeta.owner}
          </span>
          <ChevronRight size={12} strokeWidth={1.5} />
          <span className="text-xs font-medium" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#e4e4e7' }}>
            {repoMeta.name}
          </span>
        </div>

        {/* Stars badge */}
        <div
          className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full"
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          <Star size={10} fill="currentColor" style={{ color: '#71717a' }} />
          <span
            className="text-[10px]"
            style={{ color: '#71717a', fontFamily: "'JetBrains Mono', monospace" }}
          >
            {repoMeta.stars}
          </span>
        </div>
      </div>

      {/* ── Center: Segmented Glass Mode Switcher ── */}
      <div
        className="flex items-center gap-0.5 p-1 rounded-xl flex-shrink-0"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
        role="tablist"
        aria-label="Dashboard view"
      >
        {MODES.map(m => {
          const isActive = mode === m.id
          return (
            <button
              key={m.id}
              id={`mode-tab-${m.id}`}
              role="tab"
              aria-selected={isActive}
              onClick={() => onModeChange(m.id)}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: isActive ? 500 : 400,
                color: isActive ? '#ffffff' : '#52525b',
                background: isActive ? 'rgba(255,255,255,0.09)' : 'transparent',
                border: isActive ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9px',
                  color: isActive ? '#a1a1aa' : '#3f3f46',
                }}
              >
                {m.index}.
              </span>
              <span className="hidden sm:inline">{m.label}</span>
              <span className="sm:hidden">{m.index}</span>
            </button>
          )
        })}
      </div>

      {/* ── Right: Back button ── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          id="back-to-home-btn"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150"
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#71717a',
            fontFamily: "'Inter', sans-serif",
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.borderColor = 'rgba(255,255,255,0.2)'
            el.style.color = '#ffffff'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.borderColor = 'rgba(255,255,255,0.08)'
            el.style.color = '#71717a'
          }}
          aria-label="Analyze another repository"
        >
          <ArrowLeft size={11} strokeWidth={1.8} />
          <span className="hidden sm:inline">Analyze Another</span>
        </button>
        <Triangle
          size={14}
          fill="rgba(255,255,255,0.15)"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth={1.5}
          className="hidden md:block"
          aria-hidden
        />
      </div>
    </motion.header>
  )
}

export default DashboardHeader
