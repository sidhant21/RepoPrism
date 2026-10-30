import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ELEVATOR_PITCH, CONTEXT_CARDS, type ContextCard } from '../../data/expressData'

// ── File chip ──────────────────────────────────────────────────────────────────
const FileChip = ({ label }: { label: string; path: string }) => (
  <span
    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] cursor-default transition-all duration-150"
    style={{
      fontFamily: "'JetBrains Mono', monospace",
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.09)',
      color: '#71717a',
    }}
    onMouseEnter={e => {
      ;(e.currentTarget as HTMLSpanElement).style.background = 'rgba(255,255,255,0.09)'
      ;(e.currentTarget as HTMLSpanElement).style.color = '#d4d4d8'
      ;(e.currentTarget as HTMLSpanElement).style.borderColor = 'rgba(255,255,255,0.18)'
    }}
    onMouseLeave={e => {
      ;(e.currentTarget as HTMLSpanElement).style.background = 'rgba(255,255,255,0.04)'
      ;(e.currentTarget as HTMLSpanElement).style.color = '#71717a'
      ;(e.currentTarget as HTMLSpanElement).style.borderColor = 'rgba(255,255,255,0.09)'
    }}
  >
    {label}
  </span>
)

// ── Single context card ────────────────────────────────────────────────────────
const Card = ({ card, index, isExpanded, onToggle }: {
  card: ContextCard
  index: number
  isExpanded: boolean
  onToggle: () => void
}) => (
  <motion.article
    id={`context-card-${card.id}`}
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.07, ease: 'easeOut' }}
    onClick={onToggle}
    className="relative flex flex-col justify-between p-5 rounded-2xl cursor-pointer group transition-all duration-200"
    style={{
      background: isExpanded
        ? 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)'
        : 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: isExpanded
        ? '1px solid rgba(255,255,255,0.16)'
        : '1px solid rgba(255,255,255,0.07)',
      boxShadow: isExpanded
        ? '0 16px 48px 0 rgba(0,0,0,0.75)'
        : '0 8px 28px 0 rgba(0,0,0,0.55)',
    }}
    role="button"
    aria-expanded={isExpanded}
    tabIndex={0}
    onKeyDown={e => e.key === 'Enter' && onToggle()}
  >
    {/* Index + label */}
    <div className="flex items-center justify-between mb-4">
      <span
        className="text-[9px] tracking-widest"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          color: '#3f3f46',
          letterSpacing: '0.14em',
        }}
      >
        {card.index} / {card.label}
      </span>
      <motion.div
        animate={{ rotate: isExpanded ? 45 : 0 }}
        transition={{ duration: 0.2 }}
        className="w-4 h-4 flex items-center justify-center"
        style={{ color: '#3f3f46' }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M5 0V10M0 5H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </motion.div>
    </div>

    {/* Tagline */}
    <h3
      className="text-sm font-medium mb-3"
      style={{ color: '#e4e4e7', fontFamily: "'Inter', sans-serif", lineHeight: 1.3 }}
    >
      {card.tagline}
    </h3>

    {/* Bullets */}
    <AnimatePresence initial={false}>
      {isExpanded && (
        <motion.div
          key="bullets"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          style={{ overflow: 'hidden' }}
        >
          <ul className="flex flex-col gap-1.5 mb-4">
            {card.bullets.map((b, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs leading-relaxed"
                style={{ color: '#71717a', fontFamily: "'Inter', sans-serif" }}
              >
                <span className="flex-shrink-0 mt-1 w-1 h-1 rounded-full bg-zinc-600" />
                <span
                  dangerouslySetInnerHTML={{
                    __html: b.replace(
                      /`([^`]+)`/g,
                      '<code style="font-family:JetBrains Mono,monospace;font-size:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.09);padding:0 3px;border-radius:3px;color:#d4d4d8">$1</code>'
                    ),
                  }}
                />
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>

    {/* File chips — always visible */}
    <div className="flex flex-wrap gap-1.5 pt-1">
      {card.files.map(f => (
        <FileChip key={f.path} label={f.label} path={f.path} />
      ))}
    </div>

    {/* Bottom accent */}
    <div
      className="absolute bottom-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
        borderRadius: '1px',
      }}
    />
  </motion.article>
)

interface ContextCardsProps {
  cards?: ContextCard[]
  elevatorPitch?: string
  aiTitle?: string
  summary?: string
}

// ── Main ContextCards view ─────────────────────────────────────────────────────
const ContextCards = ({
  cards = CONTEXT_CARDS,
  elevatorPitch = ELEVATOR_PITCH,
  aiTitle,
  summary,
}: ContextCardsProps) => {
  const [expandedId, setExpandedId] = useState<string>(() => cards[0]?.id || 'card-entrypoint')

  const toggle = (id: string) =>
    setExpandedId(prev => (prev === id ? '' : id))

  return (
    <div className="flex flex-col h-full px-6 py-5 gap-5 overflow-y-auto">
      {/* ── AI Overview: AI Title & 2-Line Simple Summary ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center text-center max-w-2xl mx-auto gap-2 px-2"
      >
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
          }}
        >
          <span className="text-[10px] text-zinc-400 font-mono tracking-wide">
            ✦ AI Architecture Overview
          </span>
        </div>

        {aiTitle && (
          <h1
            className="text-base sm:text-lg font-semibold text-white tracking-tight"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {aiTitle}
          </h1>
        )}

        {summary && (
          <p
            className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed max-w-xl whitespace-pre-line font-light"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {summary}
          </p>
        )}

        {elevatorPitch && (
          <p
            className="text-xs text-zinc-500 italic max-w-lg leading-normal mt-0.5"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            &ldquo;{elevatorPitch}&rdquo;
          </p>
        )}
      </motion.div>

      {/* 2×2 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
        {cards.map((card, i) => (
          <Card
            key={card.id}
            card={card}
            index={i}
            isExpanded={expandedId === card.id}
            onToggle={() => toggle(card.id)}
          />
        ))}
      </div>
    </div>
  )
}

export default ContextCards
