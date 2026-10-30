import { motion } from 'framer-motion'
import { GitPullRequest, Cpu, BookOpen } from 'lucide-react'
import { CONTRIBUTION_CARDS, type ContributionCard, type IssueTag } from '../../data/expressData'

// ── Tag styling ────────────────────────────────────────────────────────────────
const TAG_CONFIG: Record<IssueTag, { icon: React.ReactNode; color: string }> = {
  'Good First Issue': {
    icon: <GitPullRequest size={10} strokeWidth={2} />,
    color: '#a1a1aa',
  },
  'AI Detected Gap': {
    icon: <Cpu size={10} strokeWidth={2} />,
    color: '#71717a',
  },
  Documentation: {
    icon: <BookOpen size={10} strokeWidth={2} />,
    color: '#71717a',
  },
}

// ── Difficulty badge ───────────────────────────────────────────────────────────
const DifficultyBadge = ({ level }: { level: 'Easy' | 'Medium' }) => (
  <span
    className="text-[9px] px-1.5 py-0.5 rounded-full"
    style={{
      fontFamily: "'JetBrains Mono', monospace",
      border: '1px solid rgba(255,255,255,0.08)',
      color: level === 'Easy' ? '#71717a' : '#a1a1aa',
      background: level === 'Easy' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
    }}
  >
    {level}
  </span>
)

// ── Single issue card ──────────────────────────────────────────────────────────
const IssueCard = ({ card, index }: { card: ContributionCard; index: number }) => {
  const tag = TAG_CONFIG[card.tag]

  return (
    <motion.article
      id={`issue-card-${card.id}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: index * 0.07, ease: 'easeOut' }}
      className="flex flex-col gap-4 p-5 rounded-2xl group transition-all duration-200"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 8px 28px 0 rgba(0,0,0,0.55)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = 'rgba(255,255,255,0.15)'
        el.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = 'rgba(255,255,255,0.07)'
        el.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)'
      }}
    >
      {/* Tag + number + difficulty */}
      <div className="flex items-center justify-between gap-2">
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
          style={{
            border: '1px solid rgba(255,255,255,0.09)',
            background: 'rgba(255,255,255,0.03)',
            color: tag.color,
          }}
        >
          {tag.icon}
          <span
            className="text-[10px]"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: tag.color }}
          >
            {card.tag}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {card.number && (
            <span
              className="text-[10px]"
              style={{ color: '#3f3f46', fontFamily: "'JetBrains Mono', monospace" }}
            >
              {card.number}
            </span>
          )}
          <DifficultyBadge level={card.difficulty} />
        </div>
      </div>

      {/* Title */}
      <h3
        className="text-sm font-medium leading-snug"
        style={{ color: '#e4e4e7', fontFamily: "'Inter', sans-serif" }}
      >
        {card.title}
      </h3>

      {/* Description */}
      <p
        className="text-xs leading-relaxed"
        style={{ color: '#71717a', fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
      >
        {card.description}
      </p>

      {/* Fix steps */}
      <div className="flex flex-col gap-1.5">
        <span
          className="text-[9px] tracking-widest uppercase"
          style={{ color: '#3f3f46', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em' }}
        >
          How to fix
        </span>
        {card.steps.map((step, i) => (
          <div key={i} className="flex items-start gap-2">
            <span
              className="flex-shrink-0 text-[9px] mt-0.5"
              style={{ color: '#3f3f46', fontFamily: "'JetBrains Mono', monospace" }}
            >
              {i + 1}.
            </span>
            <p
              className="text-[11px] leading-relaxed"
              style={{ color: '#71717a', fontFamily: "'Inter', sans-serif" }}
            >
              {step}
            </p>
          </div>
        ))}
      </div>

      {/* Target file */}
      <div className="flex items-center gap-2 pt-1">
        <span
          className="text-[9px] tracking-widest"
          style={{ color: '#3f3f46', fontFamily: "'JetBrains Mono', monospace" }}
        >
          FILE
        </span>
        <span
          className="text-[10px] px-2 py-0.5 rounded"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            color: '#a1a1aa',
          }}
        >
          {card.targetFile}
        </span>
      </div>
    </motion.article>
  )
}

interface FirstIssuesProps {
  issues?: ContributionCard[]
}

// ── Main FirstIssues view ──────────────────────────────────────────────────────
const FirstIssues = ({ issues = CONTRIBUTION_CARDS }: FirstIssuesProps) => (
  <div className="h-full overflow-y-auto px-6 py-6">
    {/* Section header */}
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex items-baseline gap-3 mb-6"
    >
      <h2
        className="text-sm font-medium"
        style={{ color: '#e4e4e7', fontFamily: "'Inter', sans-serif" }}
      >
        Contribution Opportunities
      </h2>
      <span
        className="text-[10px]"
        style={{ color: '#3f3f46', fontFamily: "'JetBrains Mono', monospace" }}
      >
        {issues.length} curated
      </span>
    </motion.div>

    {/* 3-column grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pb-4">
      {issues.map((card, i) => (
        <IssueCard key={card.id} card={card} index={i} />
      ))}
    </div>
  </div>
)

export default FirstIssues
