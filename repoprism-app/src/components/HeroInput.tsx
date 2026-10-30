import { useState, useRef, useCallback, type KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, ArrowRight, AlertCircle } from 'lucide-react'

const GITHUB_URL_PATTERN = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+(\/.*)?$/

const DEMO_REPOS = [
  { label: 'expressjs/express', url: 'https://github.com/expressjs/express' },
  { label: 'facebook/react', url: 'https://github.com/facebook/react' },
  { label: 'trpc/trpc', url: 'https://github.com/trpc/trpc' },
  { label: 'shadcn/ui', url: 'https://github.com/shadcn-ui/ui' },
]

interface HeroInputProps {
  onAnalyze?: (url: string) => Promise<void> | void
  onQuickAnalyze?: () => void
}

const Spinner = () => (
  <svg
    className="spinner"
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="7" cy="7" r="5.5" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
    <path
      d="M7 1.5A5.5 5.5 0 0 1 12.5 7"
      stroke="#000000"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

const HeroInput = ({ onAnalyze }: HeroInputProps) => {
  const [url, setUrl] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingPhase, setLoadingPhase] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadingMessages = ['Fetching repository...', 'Parsing AST...', 'Mapping architecture...', 'Curating issues...']

  const validate = useCallback((value: string): boolean => {
    if (!value.trim()) {
      setError('Please enter a GitHub repository URL.')
      return false
    }
    if (!GITHUB_URL_PATTERN.test(value.trim())) {
      setError("That doesn't look like a valid GitHub repository URL. Try: github.com/owner/repo")
      return false
    }
    setError(null)
    return true
  }, [])

  const handleAnalyze = useCallback(async (targetUrl?: string) => {
    const analyzeUrl = (typeof targetUrl === 'string' ? targetUrl : url).trim()
    if (isLoading) return
    if (!validate(analyzeUrl)) return

    setIsLoading(true)
    setError(null)
    setLoadingPhase(0)

    // Smoothly cycle through loading phases while waiting for the actual response
    const interval = setInterval(() => {
      setLoadingPhase((prev) => (prev + 1) % loadingMessages.length)
    }, 1200)

    try {
      if (onAnalyze) {
        await onAnalyze(analyzeUrl)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to analyze repository. Please check URL.')
    } finally {
      clearInterval(interval)
      setIsLoading(false)
    }
  }, [isLoading, url, validate, onAnalyze, loadingMessages.length])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAnalyze()
  }

  const handleDemoClick = (demoUrl: string) => {
    setUrl(demoUrl)
    setError(null)
    handleAnalyze(demoUrl)
  }

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Glass Input Bar */}
      <motion.div
        id="url-input-bar"
        animate={isFocused ? 'focused' : 'idle'}
        className="w-full max-w-2xl rounded-2xl p-2 flex items-center gap-3"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: isFocused
            ? '1px solid rgba(255,255,255,0.22)'
            : '1px solid rgba(255,255,255,0.08)',
          boxShadow: isFocused
            ? '0 12px 40px 0 rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)'
            : '0 12px 40px 0 rgba(0,0,0,0.5)',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        {/* Link icon */}
        <div className="pl-2 flex-shrink-0" style={{ color: '#52525b' }}>
          <Link size={15} strokeWidth={1.8} />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          id="github-url-input"
          type="url"
          value={url}
          onChange={e => {
            setUrl(e.target.value)
            if (error) setError(null)
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="https://github.com/owner/repository"
          disabled={isLoading}
          autoComplete="off"
          spellCheck={false}
          className="flex-1 bg-transparent outline-none border-none text-sm disabled:opacity-50"
          style={{
            color: '#ffffff',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
            caretColor: '#ffffff',
          }}
          aria-label="GitHub repository URL"
          aria-describedby="url-error"
        />

        {/* Analyze Button */}
        <button
          id="analyze-button"
          onClick={() => handleAnalyze()}
          disabled={isLoading}
          className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: isLoading ? '#e4e4e7' : '#ffffff',
            color: '#000000',
            fontFamily: "'Inter', sans-serif",
            fontSize: '12px',
            fontWeight: 500,
          }}
          onMouseEnter={e => {
            if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = '#e4e4e7'
          }}
          onMouseLeave={e => {
            if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = '#ffffff'
          }}
          onMouseDown={e => {
            if (!isLoading) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)'
          }}
          onMouseUp={e => {
            if (!isLoading) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
          }}
          aria-label={isLoading ? 'Analyzing repository...' : 'Analyze repository'}
        >
          {isLoading ? (
            <>
              <Spinner />
              <span className="pulse-text">{loadingMessages[loadingPhase]}</span>
            </>
          ) : (
            <>
              <span>Analyze</span>
              <ArrowRight size={12} strokeWidth={2} />
            </>
          )}
        </button>
      </motion.div>

      {/* Inline Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            id="url-error"
            role="alert"
            aria-live="polite"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-2xl flex items-start gap-2.5 px-4 py-3 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <AlertCircle size={13} strokeWidth={1.8} style={{ color: '#a1a1aa', flexShrink: 0, marginTop: '1px' }} />
            <p className="text-xs leading-relaxed" style={{ color: '#a1a1aa', fontFamily: "'Inter', sans-serif", margin: 0 }}>
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo chips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="flex flex-wrap items-center justify-center gap-2"
        aria-label="Sample repositories"
      >
        <span className="text-[11px] mr-1" style={{ color: '#52525b', fontFamily: "'Inter', sans-serif" }}>
          Try:
        </span>
        {DEMO_REPOS.map(repo => (
          <button
            key={repo.label}
            id={`demo-${repo.label.replace('/', '-')}`}
            onClick={() => handleDemoClick(repo.url)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg text-xs transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.02)',
              color: '#a1a1aa',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = 'rgba(255,255,255,0.08)'
              el.style.borderColor = 'rgba(255,255,255,0.25)'
              el.style.color = '#ffffff'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = 'rgba(255,255,255,0.02)'
              el.style.borderColor = 'rgba(255,255,255,0.1)'
              el.style.color = '#a1a1aa'
            }}
            aria-label={`Analyze ${repo.label}`}
          >
            {repo.label}
          </button>
        ))}
      </motion.div>
    </div>
  )
}

export default HeroInput
