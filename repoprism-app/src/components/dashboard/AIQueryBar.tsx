import { useState, useRef, type KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Send } from 'lucide-react'
import {
  AI_QUICK_PROMPTS,
  AI_ANSWERS,
  type AIAnswer,
} from '../../data/expressData'
import { REPO_META } from '../../data/expressData'

// ── File badge inline ─────────────────────────────────────────────────────────
const FileBadge = ({ label }: { label: string }) => (
  <code
    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px]"
    style={{
      fontFamily: "'JetBrains Mono', monospace",
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.12)',
      color: '#d4d4d8',
    }}
  >
    {label}
  </code>
)

// ── Typing indicator ──────────────────────────────────────────────────────────
const TypingDots = () => (
  <div className="flex items-center gap-1 py-1">
    {[0, 1, 2].map(i => (
      <span
        key={i}
        className="w-1 h-1 rounded-full"
        style={{
          background: '#52525b',
          animation: `typing-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }}
      />
    ))}
  </div>
)

interface AIQueryBarProps {
  repoUrl?: string
}

// ── Main AIQueryBar ───────────────────────────────────────────────────────────
const AIQueryBar = ({ repoUrl }: AIQueryBarProps) => {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [answer, setAnswer] = useState<AIAnswer | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed || isLoading) return

    setIsLoading(true)
    setAnswer(null)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: repoUrl || undefined,
          question: trimmed,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setAnswer({
          question: trimmed,
          answer: data.answer || 'No answer generated.',
          fileBadges: data.fileBadges || [],
        })
      } else {
        throw new Error('API request failed')
      }
    } catch {
      // Fallback: match against mock answers or dynamic fallback
      const match =
        AI_ANSWERS.find(a =>
          a.question.toLowerCase().includes(trimmed.toLowerCase()) ||
          trimmed.toLowerCase().includes(a.question.toLowerCase().split(' ').slice(1, 4).join(' '))
        ) ?? {
          question: trimmed,
          answer: `Here is what the codebase indicates regarding "${trimmed}": The central execution flow dispatches work through the primary module and controller components. You can inspect the implementation in the file explorer.`,
          fileBadges: [{ label: 'README.md', path: 'README.md' }],
        }

      setAnswer(match)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit(query)
  }

  const handleQuickPrompt = (prompt: string) => {
    setQuery(prompt)
    handleSubmit(prompt)
    inputRef.current?.focus()
  }

  const clearAnswer = () => {
    setAnswer(null)
    setQuery('')
  }

  const hasChat = isLoading || answer !== null

  return (
    <>
      {/* Typing animation CSS */}
      <style>{`
        @keyframes typing-bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div
        id="ai-query-bar"
        className="absolute bottom-6 left-1/2 z-50 w-full max-w-xl px-4"
        style={{ transform: 'translateX(-50%)' }}
        aria-label="AI query bar"
      >
        {/* ── Chat drawer (above input) ── */}
        <AnimatePresence>
          {hasChat && (
            <motion.div
              key="chat-drawer"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="mb-2 rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 24px 64px 0 rgba(0,0,0,0.85)',
                maxHeight: '300px',
              }}
              role="region"
              aria-label="AI response"
              aria-live="polite"
            >
              <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
                {/* Drawer header */}
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={11} strokeWidth={1.8} style={{ color: '#71717a' }} />
                    <span
                      className="text-[11px]"
                      style={{ color: '#52525b', fontFamily: "'Inter', sans-serif" }}
                    >
                      {isLoading ? 'Thinking...' : (answer?.question ?? '')}
                    </span>
                  </div>
                  <button
                    id="close-chat-btn"
                    onClick={clearAnswer}
                    className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-all duration-150"
                    style={{
                      color: '#52525b',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.color = '#a1a1aa'
                      el.style.borderColor = 'rgba(255,255,255,0.14)'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.color = '#52525b'
                      el.style.borderColor = 'rgba(255,255,255,0.06)'
                    }}
                    aria-label="Close chat"
                  >
                    <X size={10} strokeWidth={2} />
                    <span style={{ fontFamily: "'Inter', sans-serif" }}>Close</span>
                  </button>
                </div>

                {/* Content */}
                <div className="px-4 py-4">
                  {isLoading ? (
                    <TypingDots />
                  ) : answer ? (
                    <div className="flex flex-col gap-3">
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: '#a1a1aa', fontFamily: "'Inter', sans-serif" }}
                      >
                        {answer.answer}
                      </p>
                      {/* File badges */}
                      {answer.fileBadges.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          <span
                            className="text-[9px] mr-1 self-center"
                            style={{ color: '#3f3f46', fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            see →
                          </span>
                          {answer.fileBadges.map(b => (
                            <FileBadge key={b.path} label={b.label} />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Quick prompt pills (show on focus, no chat open) ── */}
        <AnimatePresence>
          {isFocused && !hasChat && (
            <motion.div
              key="quick-prompts"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18 }}
              className="flex flex-wrap gap-1.5 mb-2 justify-center"
            >
              {AI_QUICK_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onMouseDown={e => {
                    e.preventDefault()
                    handleQuickPrompt(prompt)
                  }}
                  className="px-3 py-1 rounded-full text-[10px] transition-all duration-150"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#71717a',
                    backdropFilter: 'blur(12px)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.background = 'rgba(255,255,255,0.1)'
                    el.style.color = '#d4d4d8'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.background = 'rgba(255,255,255,0.05)'
                    el.style.color = '#71717a'
                  }}
                  aria-label={`Quick prompt: ${prompt}`}
                >
                  {prompt}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main input pill ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex items-center gap-2 px-3 py-2 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: isFocused
              ? '1px solid rgba(255,255,255,0.2)'
              : '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 16px 48px 0 rgba(0,0,0,0.8)',
            transition: 'border-color 0.18s ease',
          }}
        >
          <Sparkles
            size={14}
            strokeWidth={1.6}
            style={{ color: '#52525b', flexShrink: 0 }}
          />
          <input
            ref={inputRef}
            id="ai-query-input"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask anything about ${REPO_META.owner}/${REPO_META.name}...`}
            className="flex-1 bg-transparent border-none outline-none text-xs"
            style={{
              color: '#e4e4e7',
              fontFamily: "'Inter', sans-serif",
              caretColor: '#ffffff',
            }}
            aria-label="AI question input"
            disabled={isLoading}
          />
          {/* Submit */}
          <button
            id="ai-submit-btn"
            onClick={() => handleSubmit(query)}
            disabled={isLoading || !query.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 flex-shrink-0 disabled:opacity-30"
            style={{
              background: '#ffffff',
              color: '#000000',
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={e => {
              if (!isLoading && query.trim())
                (e.currentTarget as HTMLButtonElement).style.background = '#e4e4e7'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#ffffff'
            }}
            aria-label="Submit question"
          >
            {isLoading ? (
              <svg className="spinner" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
                <path d="M6 1.5A4.5 4.5 0 0 1 10.5 6" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            ) : (
              <Send size={11} strokeWidth={2} />
            )}
          </button>
        </motion.div>
      </div>
    </>
  )
}

export default AIQueryBar
